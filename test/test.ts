import test from 'ava';
import tempy = require('tempy');
import pMap = require('p-map');
import jetpack = require('fs-jetpack');
import { JsonObject } from 'type-fest';
import { FSJetpack } from 'fs-jetpack/types';
import tory from '../source';
import { sortLexicographically as sort } from '../source/helpers/sort-lexicographically';
import { ToryFiler } from '../source/helpers/tory-filer';
import { ToryFolderDiff } from '../source/helpers/tory-folder-diff';
import { pRepeatLogging } from './helpers/p-repeat';
import { attemptDelete } from './helpers/attempt-delete';
import { getRandomTestFolder } from './helpers/get-random-test-folder';
import { getTempJetpack } from './helpers/get-temp-jetpack';
import { RandomStringBuilder } from './helpers/random-string-builder';

const { ToryFolder, ToryFile } = tory;

function simplifyToryDiff(result: ToryFolderDiff): JsonObject {
	return {
		extraFilesOnFirst: result.extraFilesOnFirst.map(x => x.name),
		extraFilesOnSecond: result.extraFilesOnSecond.map(x => x.name),
		modifiedFiles: result.modifiedFiles.map(x => x.first.name),
		renamedFiles: result.renamedFiles.map(x => ({
			first: x.first.name,
			second: x.second.name
		})),
		unchangedFiles: result.unchangedFiles.map(x => x.first.name)
	};
}

test('ToryFolder (constructor)', t => {
	const result = new ToryFolder('.');

	const filers: ToryFiler[] = [...result.getFiles(), ...result.getSubfolders()];
	t.deepEqual(filers, result.getFilers());
	t.deepEqual(filers, [...result]);

	t.true(result.getFiles().some(file => file.name === 'package.json'));
	t.true(result.getSubfolders().some(subfolder => subfolder.name === 'source'));
	t.true(result.getSubfolders().some(subfolder => subfolder.name === 'node_modules'));
});

test('ToryFolder#sameContentsShallow and ToryFolder#sameContentsDeep', async t => {
	function sameContentsDeep(jetA: FSJetpack, jetB: FSJetpack): boolean {
		const tfA = new ToryFolder(jetA.cwd());
		const tfB = new ToryFolder(jetB.cwd());
		const result1 = tfA.sameContentsDeep(tfB);
		const result2 = tfB.sameContentsDeep(tfA);
		t.is(result1, result2);
		return result1;
	}

	function sameContentsShallow(jetA: FSJetpack, jetB: FSJetpack): boolean {
		const tfA = new ToryFolder(jetA.cwd());
		const tfB = new ToryFolder(jetB.cwd());
		const result1 = tfA.sameContentsShallow(tfB);
		const result2 = tfB.sameContentsShallow(tfA);
		t.is(result1, result2);
		return result1;
	}

	const folderA = getTempJetpack();
	const folderB = getTempJetpack();

	t.true(sameContentsShallow(folderA, folderB));
	t.true(sameContentsDeep(folderA, folderB));

	await folderA.writeAsync('a/b/c', 'foo');

	t.false(sameContentsShallow(folderA, folderB));
	t.false(sameContentsDeep(folderA, folderB));

	await folderB.dirAsync('a');

	t.true(sameContentsShallow(folderA, folderB));
	t.false(sameContentsDeep(folderA, folderB));

	await folderB.writeAsync('a/b/c', 'foo');

	t.true(sameContentsShallow(folderA, folderB));
	t.true(sameContentsDeep(folderA, folderB));

	await folderB.dirAsync('a/z');

	t.true(sameContentsShallow(folderA, folderB));
	t.false(sameContentsDeep(folderA, folderB));

	await folderB.dirAsync('y');

	t.false(sameContentsShallow(folderA, folderB));
	t.false(sameContentsDeep(folderA, folderB));

	await attemptDelete(folderA.cwd());
	await attemptDelete(folderB.cwd());
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

test('ToryFolder#compareFilesShallow', async t => {
	await pRepeatLogging(t, 100, async () => {
		const randomStrings = new RandomStringBuilder(0);

		const testFolder = jetpack.cwd(tempy.directory());

		const contentA = randomStrings.next();
		const contentB = randomStrings.next();
		const contentC = randomStrings.next();

		testFolder.write('folderA/file0.txt', contentA);
		testFolder.write('folderA/file1.txt', randomStrings.next());
		testFolder.write('folderA/file2.txt', randomStrings.next());
		testFolder.write('folderA/file3.txt', contentB);

		testFolder.write('folderB/file0.txt', contentA);
		testFolder.write('folderB/file1.txt', randomStrings.next());
		testFolder.write('folderB/file3.txt', randomStrings.next());
		testFolder.write('folderB/file4.txt', contentB);

		testFolder.write('folderA/nested/foo.txt', randomStrings.next());
		testFolder.write('folderA/nested/bar.txt', randomStrings.next());

		testFolder.write('folderA/identicalX.txt', contentC);
		testFolder.write('folderA/identicalY.txt', contentC);
		testFolder.write('folderB/identicalX.txt', contentC);
		testFolder.write('folderB/identicalY.txt', contentC);

		const folderA = new ToryFolder(testFolder.path('folderA'));
		const folderB = new ToryFolder(testFolder.path('folderB'));

		t.deepEqual(simplifyToryDiff(folderA.compareFilesShallow(folderB)), {
			extraFilesOnFirst: ['file2.txt'],
			extraFilesOnSecond: ['file3.txt'],
			modifiedFiles: ['file1.txt'],
			renamedFiles: [{ first: 'file3.txt', second: 'file4.txt' }],
			unchangedFiles: ['file0.txt', 'identicalX.txt', 'identicalY.txt']
		});

		t.deepEqual(simplifyToryDiff(folderB.compareFilesShallow(folderA)), {
			extraFilesOnFirst: ['file3.txt'],
			extraFilesOnSecond: ['file2.txt'],
			modifiedFiles: ['file1.txt'],
			renamedFiles: [{ first: 'file4.txt', second: 'file3.txt' }],
			unchangedFiles: ['file0.txt', 'identicalX.txt', 'identicalY.txt']
		});

		await attemptDelete(testFolder.cwd());
	});
});

test('ToryFolder#compareFiles', async t => {
	const TEST_FOLDER_SIZE = 200;
	await pRepeatLogging(t, 20, async () => {
		const pathA = (await getRandomTestFolder(TEST_FOLDER_SIZE)).path;
		const pathB = tempy.directory();

		await jetpack.copyAsync(pathA, pathB, { overwrite: true });

		let folderA = new ToryFolder(pathA);
		let folderB = new ToryFolder(pathB);

		let diff = folderA.compareFiles(folderB);
		let mirroredDiff = folderB.compareFiles(folderA);

		/// t.log(simplifyToryDiff(diff));
		t.true(diff.noDiffs());
		t.true(mirroredDiff.noDiffs());

		const deletedFileNames: string[] = [];
		let deleteFlag = true;
		await pMap(
			folderA.toDFSFilesRecursiveIterable(),
			async file => {
				if (deleteFlag) {
					deletedFileNames.push(file.name);
					/// t.log(`Deleting '${file.name}'`);
					await jetpack.removeAsync(file.absolutePath);
				}

				if (Math.random() < 0.25) {
					deleteFlag = !deleteFlag;
				}
			},
			{ concurrency: 8 }
		);

		t.true(diff.noDiffs());
		t.true(mirroredDiff.noDiffs());

		// Since the ToryFolders were created before deletion, performing a new diff will not notice the difference!
		diff = folderA.compareFiles(folderB);
		mirroredDiff = folderB.compareFiles(folderA);
		t.true(diff.noDiffs());
		t.true(mirroredDiff.noDiffs());

		folderA = new ToryFolder(pathA);
		folderB = new ToryFolder(pathB);

		diff = folderA.compareFiles(folderB);
		mirroredDiff = folderB.compareFiles(folderA);
		/// t.log(simplifyToryDiff(diff));
		t.false(diff.noDiffs());
		t.false(mirroredDiff.noDiffs());

		t.deepEqual(
			sort(diff.extraFilesOnSecond.map(x => x.name)),
			sort(deletedFileNames)
		);

		await pMap([pathA, pathB], attemptDelete);
	});
});

test('ToryFolder#toDFSFilesRecursiveIterable', async t => {
	const TEST_FOLDER_SIZE = 300;
	await pRepeatLogging(t, 15, async () => {
		const { fileNames, path } = await getRandomTestFolder(TEST_FOLDER_SIZE);
		const folder = new ToryFolder(path);

		const result = [...folder.toDFSFilesRecursiveIterable()].map(f => f.name);

		t.is(result.length, TEST_FOLDER_SIZE);

		t.deepEqual(
			sort(result),
			sort(fileNames)
		);

		await attemptDelete(path);
	});
});

test('Example from readme', async t => {
	const TEST_FOLDER_SIZE = 100;
	await pRepeatLogging(t, 30, async () => {
		const { fileNames, folderNames, path } = await getRandomTestFolder(TEST_FOLDER_SIZE);
		const folder = new ToryFolder(path);

		let shallowCount = 0;

		for (const filer of folder) {
			t.truthy(filer.name);
			if (filer instanceof ToryFile) {
				t.truthy(filer.getSize());
				t.truthy(filer.getHash());
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
				t.truthy(filer.getHash());
				t.is(filer.type, 'file');

				deepFileNames.push(filer.name);
				deepFileCount++;
			} else {
				t.true(filer instanceof ToryFolder);
			}
		}

		t.is(deepFileCount, TEST_FOLDER_SIZE);
		t.is(deepNames.length, TEST_FOLDER_SIZE + folderNames.length);

		t.deepEqual(sort(deepFileNames), sort(fileNames));

		t.deepEqual(
			sort(deepNames),
			sort([...fileNames, ...folderNames])
		);

		await attemptDelete(path);
	});
});
