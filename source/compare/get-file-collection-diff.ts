import { File, FilePair, FileCollectionDiff } from '../types';
export { File } from '../types';

function sameContents(first: File, second: File): boolean {
	return first.size === second.size && first.sha256 === second.sha256;
}

export function getFileCollectionDiff(
	firstFileCollection: Iterable<File>,
	secondFileCollection: Iterable<File>
): FileCollectionDiff {
	const remainingFirst = new Set(firstFileCollection);
	const remainingSecond = new Set(secondFileCollection);

	const renamedFiles = new Set<FilePair>();
	const modifiedFiles = new Set<FilePair>();
	const unchangedFiles = new Set<FilePair>();

	for (const file1 of firstFileCollection) {
		for (const file2 of secondFileCollection) {
			if (sameContents(file1, file2)) {
				remainingFirst.delete(file1);
				remainingSecond.delete(file2);
				if (file1.name === file2.name) {
					unchangedFiles.add({ first: file1, second: file2 });
				} else {
					renamedFiles.add({ first: file1, second: file2 });
				}
			}
		}
	}

	const _remainingFirst = new Set(remainingFirst);
	const _remainingSecond = new Set(remainingSecond);
	for (const file1 of _remainingFirst) {
		for (const file2 of _remainingSecond) {
			if (file1.name === file2.name) {
				remainingFirst.delete(file1);
				remainingSecond.delete(file2);
				// Surely they don't have the same contents, since they would
				// have already been picked in the first doubleloop above.
				modifiedFiles.add({ first: file1, second: file2 });
			}
		}
	}

	return {
		extraFilesOnFirst: remainingFirst,
		extraFilesOnSecond: remainingSecond,
		renamedFiles,
		modifiedFiles,
		unchangedFiles
	};
}
