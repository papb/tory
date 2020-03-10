import pMap = require('p-map');
import { ExecutionContext } from 'ava'; // eslint-disable-line ava/use-test

type RepeatCallback = () => void | Promise<void>;

function defaultConcurrency(times: number): number {
	return Math.max(5, Math.min(40, Math.floor(10 * Math.log10(times))));
}

export async function pRepeat(times: number, callback: RepeatCallback, concurrency?: number): Promise<void> {
	await pMap([...new Array(times)], callback, {
		concurrency: concurrency ?? defaultConcurrency(times)
	});
}

export async function pRepeatLogging(t: ExecutionContext, times: number, callback: RepeatCallback, concurrency?: number): Promise<void> {
	t.log(`Running ${times} times with concurrency ${concurrency ?? defaultConcurrency(times)}`);
	await pRepeat(times, callback, concurrency);
}
