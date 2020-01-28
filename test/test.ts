import test from 'ava';
import tory from '../source';
import tempy = require('tempy');
import jetpack = require('fs-jetpack');
import { sortLexicographically } from '../source/helpers/sort-lexicographically';

const { describeFolder, compareFilesInFolders, getAllFilesRecursively } = tory;

async function attemptDelete(absolutePath: string): Promise<void> {
	try {
		await jetpack.removeAsync(absolutePath);
	} catch (error) {
		console.warn(`Unable to cleanup temp file(s) ('${absolutePath}') after test:`, error);
	}
}

test('describeFolder', t => {
	/// t.throws(() => {
	/// 	(describeFolder as any)(123);
	/// }, 'Expected a string, got number');

	const result = describeFolder('.');

	t.true(result.files.some(file => file.name === 'package.json'));
	t.true(result.folders.some(folder => folder.name === 'source'));
	t.false(result.folders.some(folder => folder.name === 'node_modules'));
	t.true(result.skippedFolders.some(folder => folder.name === 'node_modules'));
	t.true(result.hasDeepSkippedFolder);
});

test('compareFilesInFolders', async t => {
	/// t.throws(() => {
	/// 	(compareFilesInFolders as any)(123);
	/// }, 'Expected a string, got number');

	const testFolder = jetpack.cwd(tempy.directory());
	testFolder.write('folderA/file0.txt', `${Math.random()}`);
	testFolder.write('folderA/file1.txt', `${Math.random()}`);
	testFolder.write('folderA/file2.txt', `${Math.random()}`);
	testFolder.write('folderA/file3.txt', `${Math.random()}`);
	testFolder.write('folderB/file1.txt', `${Math.random()}`);
	testFolder.write('folderB/file3.txt', `${Math.random()}`);
	testFolder.copy('folderA/file0.txt', 'folderB/file0.txt');
	testFolder.copy('folderA/file3.txt', 'folderB/file4.txt');

	const result = compareFilesInFolders(testFolder.path('folderA'), testFolder.path('folderB'));

	const simplifiedResult = {
		extraFilesOnFirst: [...result.extraFilesOnFirst].map(x => x.name),
		extraFilesOnSecond: [...result.extraFilesOnSecond].map(x => x.name),
		modifiedFiles: [...result.modifiedFiles].map(x => x.first.name),
		renamedFiles: [...result.renamedFiles].map(x => ({
			first: x.first.name,
			second: x.second.name
		})),
		unchangedFiles: [...result.unchangedFiles].map(x => x.first.name)
	};

	t.deepEqual(simplifiedResult, {
		extraFilesOnFirst: ['file2.txt'],
		extraFilesOnSecond: ['file3.txt'],
		modifiedFiles: ['file1.txt'],
		renamedFiles: [{ first: 'file3.txt', second: 'file4.txt' }],
		unchangedFiles: ['file0.txt']
	});

	await attemptDelete(testFolder.cwd());
});

test('getAllFilesRecursively', async t => {
	/// t.throws(() => {
	/// 	(compareFilesInFolders as any)(123);
	/// }, 'Expected a string, got number');

	async function fillFolderRandomly(folderAbsolutePath: string, amountOfFiles: number): Promise<string[]> {
		/* eslint-disable no-await-in-loop */
		if (amountOfFiles === 0) {
			return [];
		}

		const fileNames: string[] = [];
		const amountOfSubfolders = Math.floor(5 * Math.random());
		const amountOfFilesPerSubfolder = Math.floor(amountOfFiles / (amountOfSubfolders + 1));
		for (let i = 0; i < amountOfSubfolders; i++) {
			const subfolderAbsolutePath = jetpack.path(folderAbsolutePath, `${Math.random()}`);
			await jetpack.dirAsync(subfolderAbsolutePath);
			fileNames.push(...(
				await fillFolderRandomly(subfolderAbsolutePath, amountOfFilesPerSubfolder)
			));
		}

		const amountOfFilesLeftToCreate = amountOfFiles - (amountOfSubfolders * amountOfFilesPerSubfolder);
		for (let i = 0; i < amountOfFilesLeftToCreate; i++) {
			const fileName = `${Math.random()}`;
			await jetpack.writeAsync(jetpack.path(folderAbsolutePath, fileName), `${Math.random()}`);
			fileNames.push(fileName);
		}

		return fileNames;
		/* eslint-enable no-await-in-loop */
	}

	const testFolder = jetpack.cwd(tempy.directory());
	const fileNames = await fillFolderRandomly(testFolder.cwd(), 100);
	const result = getAllFilesRecursively(testFolder.cwd());

	t.deepEqual(
		sortLexicographically(
			result.map(f => f.name)
		),
		sortLexicographically(fileNames)
	);

	await attemptDelete(testFolder.cwd());
});
