/**
 * Shuffles the given array in-place, using the Fisher-Yates algorithm (also known
 * as Knuth algorithm).
 *
 * http://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
 * Credits to http://sedition.com/perl/javascript-fy.html
 * Thanks also to CoolAJ86
 */
export function shuffleArrayInPlace<T = any>(array: T[]): void {
	let currentIndex = array.length;
	let randomIndex: number;
	let temp: T;

	// While there remain elements to shuffle...
	while (currentIndex > 0) {
		// Pick a remaining element...
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex--;

		// And swap it with the current element.
		temp = array[currentIndex];
		array[currentIndex] = array[randomIndex];
		array[randomIndex] = temp;
	}
}
