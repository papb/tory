import test from 'ava';
import tory from '../source';

test('title', t => {
	t.throws(() => {
		(tory as any)(123);
	}, 'Expected a string or undefined, got number');

	t.is(tory()['package.json'], 'file');
});
