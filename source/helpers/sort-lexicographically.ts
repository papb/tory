export function sortLexicographically(array: string[]): void {
	array.sort((a, b) => {
		a = a.toUpperCase();
		b = b.toUpperCase();
		if (a < b) {
			return -1;
		}

		return a > b ? 1 : 0;
	});
}
