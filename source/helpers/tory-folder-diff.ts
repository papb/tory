import { relative } from 'path';
import { ToryFile } from '../tory-file';
import { ToryFolder } from '../tory-folder';
import { iterableFromToryFolder, RecursionDecider } from './iterable-from-tory-folder';

export type ToryFilePair = { first: ToryFile; second: ToryFile };

function sameContents(first: ToryFile, second: ToryFile): boolean {
	return first.getSize() === second.getSize() &&
		first.getSha256() === second.getSha256();
}

function getRelativePath(file: ToryFile, rootFolder: ToryFolder): string {
	return relative(rootFolder.absolutePath, file.absolutePath);
}

export class ToryFolderDiff {
	private readonly _extraFilesOnFirst: Set<ToryFile>;
	private readonly _extraFilesOnSecond: Set<ToryFile>;
	private readonly _renamedFiles: Set<ToryFilePair>;
	private readonly _modifiedFiles: Set<ToryFilePair>;
	private readonly _unchangedFiles: Set<ToryFilePair>;

	constructor(
		public readonly firstFolder: ToryFolder,
		public readonly secondFolder: ToryFolder,
		public readonly recursionDecider?: RecursionDecider
	) {
		const firstIterable = recursionDecider ?
			iterableFromToryFolder(firstFolder, recursionDecider) :
			firstFolder.toDefaultRecursiveIterable();
		const secondIterable = recursionDecider ?
			iterableFromToryFolder(secondFolder, recursionDecider) :
			secondFolder.toDefaultRecursiveIterable();

		const firstFiles = new Set<ToryFile>();
		const secondFiles = new Set<ToryFile>();
		const remainingFirst = new Set<ToryFile>();
		const remainingSecond = new Set<ToryFile>();

		for (const filer of firstIterable) {
			if (filer.type === 'file') {
				firstFiles.add(filer as ToryFile);
				remainingFirst.add(filer as ToryFile);
			}
		}

		for (const filer of secondIterable) {
			if (filer.type === 'file') {
				secondFiles.add(filer as ToryFile);
				remainingSecond.add(filer as ToryFile);
			}
		}

		const renamedFiles = new Set<ToryFilePair>();
		const modifiedFiles = new Set<ToryFilePair>();
		const unchangedFiles = new Set<ToryFilePair>();

		for (const file1 of firstFiles) {
			for (const file2 of secondFiles) {
				if (sameContents(file1, file2)) {
					remainingFirst.delete(file1);
					remainingSecond.delete(file2);
					if (getRelativePath(file1, firstFolder) === getRelativePath(file2, secondFolder)) {
						unchangedFiles.add({ first: file1, second: file2 });
					} else {
						renamedFiles.add({ first: file1, second: file2 });
					}
				}
			}
		}

		for (const file1 of [...remainingFirst]) {
			for (const file2 of [...remainingSecond]) {
				if (getRelativePath(file1, firstFolder) === getRelativePath(file2, secondFolder)) {
					remainingFirst.delete(file1);
					remainingSecond.delete(file2);
					// Surely they don't have the same contents, since they would
					// have already been picked in the first doubleloop above.
					modifiedFiles.add({ first: file1, second: file2 });
				}
			}
		}

		this._extraFilesOnFirst = remainingFirst;
		this._extraFilesOnSecond = remainingSecond;
		this._renamedFiles = renamedFiles;
		this._modifiedFiles = modifiedFiles;
		this._unchangedFiles = unchangedFiles;
	}

	get extraFilesOnFirst(): ToryFile[] {
		return [...this._extraFilesOnFirst];
	}

	get extraFilesOnSecond(): ToryFile[] {
		return [...this._extraFilesOnSecond];
	}

	get renamedFiles(): ToryFilePair[] {
		return [...this._renamedFiles];
	}

	get modifiedFiles(): ToryFilePair[] {
		return [...this._modifiedFiles];
	}

	get unchangedFiles(): ToryFilePair[] {
		return [...this._unchangedFiles];
	}
}
