import assert = require('assert');
import { shuffleArrayInPlace } from './shuffle-array-in-place';

export function getRandomNumbersWithSumConstraint(count: number, sum: number): number[] {
	assert(/^[1-9]\d*$/.test(count.toString()), 'count must be a positive integer');
	assert(/^\d+$/.test(sum.toString()), 'sum must be a non-negative integer');
	const dots = [...new Array(sum)].map(() => '.');
	const pipes = [...new Array(count - 1)].map(() => '|');
	const all = dots.concat(pipes);
	shuffleArrayInPlace(all);
	return all.join('').split('|').map(part => part.length);
}
