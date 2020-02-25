import test from 'ava';
import tory from '../source';
import tempy = require('tempy');
import jetpack = require('fs-jetpack');
import { sortLexicographically } from '../source/helpers/sort-lexicographically';
import { ToryFiler } from '../source/helpers/tory-filer';
import { attemptDelete } from './helpers/attempt-delete';
import { getRandomTestFolder } from './helpers/get-random-test-folder';
import { getTempJetpack } from './helpers/get-temp-jetpack';

const { ToryFolder, ToryFile } = tory;

test('ToryFolder (constructor)', t => {
	const result = new ToryFolder('.');

	const filers: ToryFiler[] = [...result.getFiles(), ...result.getSubfolders()];
	t.deepEqual(filers, result.getFilers());
	t.deepEqual(filers, [...result]);

	t.true(result.getFiles().some(file => file.name === 'package.json'));
	t.true(result.getSubfolders().some(subfolder => subfolder.name === 'source'));
	t.true(result.getSubfolders().some(subfolder => subfolder.name === 'node_modules'));
});

test('ToryFolder#toDefaultRecursiveIterable', async t => {
	const tempJetpack = getTempJetpack();
	tempJetpack.write('a/b/c/d/e/f/g/h.txt', 'foo');
	tempJetpack.write('a/b/c/d/e.txt', 'bar');

	const folder = new ToryFolder(tempJetpack.cwd());

	const visitedFileNames: string[] = [];
	const visitedFolderNames: string[] = [];

	for (const filer of folder.toDefaultRecursiveIterable()) {
		if (filer.type === 'file') {
			visitedFileNames.push(filer.name);
		} else {
			visitedFolderNames.push(filer.name);
		}
	}

	t.deepEqual(visitedFileNames, ['e.txt', 'h.txt']);
	t.deepEqual(visitedFolderNames, 'abcdefg'.split(''));

	await attemptDelete(tempJetpack.cwd());
});

test('ToryFolder#compare', async t => {
	const testFolder = jetpack.cwd(tempy.directory());
	testFolder.write('folderA/file0.txt', `${Math.random()}`);
	testFolder.write('folderA/file1.txt', `${Math.random()}`);
	testFolder.write('folderA/file2.txt', `${Math.random()}`);
	testFolder.write('folderA/file3.txt', `${Math.random()}`);
	testFolder.write('folderB/file1.txt', `${Math.random()}`);
	testFolder.write('folderB/file3.txt', `${Math.random()}`);
	testFolder.copy('folderA/file0.txt', 'folderB/file0.txt');
	testFolder.copy('folderA/file3.txt', 'folderB/file4.txt');

	const folderA = new ToryFolder(testFolder.path('folderA'));
	const folderB = new ToryFolder(testFolder.path('folderB'));

	const result = folderA.compare(folderB);

	const simplifiedResult = {
		extraFilesOnFirst: result.extraFilesOnFirst.map(x => x.name),
		extraFilesOnSecond: result.extraFilesOnSecond.map(x => x.name),
		modifiedFiles: result.modifiedFiles.map(x => x.first.name),
		renamedFiles: result.renamedFiles.map(x => ({
			first: x.first.name,
			second: x.second.name
		})),
		unchangedFiles: result.unchangedFiles.map(x => x.first.name)
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

test('ToryFolder#toDFSFilesRecursiveIterable', async t => {
	const { fileNames, path } = await getRandomTestFolder(100);
	const folder = new ToryFolder(path);

	const result = [...folder.toDFSFilesRecursiveIterable()].map(f => f.name);

	t.deepEqual(
		sortLexicographically(result),
		sortLexicographically(fileNames)
	);

	await attemptDelete(path);
});

test('Example from readme', async t => {
	const { fileNames, folderNames, path } = await getRandomTestFolder(100);
	const folder = new ToryFolder(path);

	let shallowCount = 0;

	for (const filer of folder) {
		t.truthy(filer.name);
		if (filer instanceof ToryFile) {
			t.truthy(filer.getSize());
			t.truthy(filer.getSha256());
		} else {
			t.true(filer instanceof ToryFolder);
		}

		shallowCount++;
	}

	t.is(shallowCount, jetpack.list(path)!.length);

	let deepFileCount = 0;
	const deepNames: string[] = [];
	const deepFileNames: string[] = [];

	for (const filer of folder.toDefaultRecursiveIterable()) {
		t.truthy(filer.name);
		deepNames.push(filer.name);
		if (filer instanceof ToryFile) {
			t.truthy(filer.getSize());
			t.truthy(filer.getSha256());
			t.is(filer.type, 'file');

			deepFileNames.push(filer.name);
			deepFileCount++;
		} else {
			t.true(filer instanceof ToryFolder);
		}
	}

	t.deepEqual(
		sortLexicographically(deepNames),
		sortLexicographically([...fileNames, ...folderNames])
	);

	t.is(deepFileCount, 100);

	await attemptDelete(path);
});
