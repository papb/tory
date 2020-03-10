import { ascending } from 'alpha-sort';

export function sortLexicographically(array: string[]): string[] {
	return array.slice().sort(ascending);
}
