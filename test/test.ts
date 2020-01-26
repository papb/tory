import test from 'ava';
import tory from '../source';
import tempy = require('tempy');
import jetpack = require('fs-jetpack');

const { describeFolder, compareFilesInFolders } = tory;

test('describeFolder', t => {
	// T.throws(() => {
	// 	(describeFolder as any)(123);
	// }, 'Expected a string, got number');

	const result = describeFolder('.');

	t.true(result.files.some(file => file.name === 'package.json'));
	t.true(result.folders.some(folder => folder.name === 'source'));
	t.false(result.folders.some(folder => folder.name === 'node_modules'));
	t.true(result.skippedFolders.some(folder => folder.name === 'node_modules'));
	t.true(result.hasDeepSkippedFolder);
});

test('compareFilesInFolders', t => {
	// T.throws(() => {
	// 	(compareFilesInFolders as any)(123);
	// }, 'Expected a string, got number');

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
});
