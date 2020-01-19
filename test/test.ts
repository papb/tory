import test from 'ava';
import tory from '../source';
import jetpack = require('fs-jetpack');

test('title', t => {
	// T.throws(() => {
	// 	(tory as any)(123);
	// }, 'Expected a string, got number');

	const result = tory.describeFolder('.');

	jetpack.write('argh.json', JSON.stringify(result, null, '\t'));

	t.true(result.files.some(file => file.name === 'package.json'));
	t.true(result.folders.some(folder => folder.name === 'source'));
	t.false(result.folders.some(folder => folder.name === 'node_modules'));
	t.true(result.skippedFolders.some(folder => folder.name === 'node_modules'));
	t.true(result.skippedSomething);
});
