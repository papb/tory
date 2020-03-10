import { relative } from 'path';
import { ToryFile } from '../tory-file';
import { ToryFolder } from '../tory-folder';
import { iterableFromToryFolder, RecursionDecider } from './iterable-from-tory-folder';

export type ToryFilePair = { first: ToryFile; second: ToryFile };

function getRelativePath(file: ToryFile, rootFolder: ToryFolder): string {
	return relative(rootFolder.absolutePath, file.absolutePath);
}

export class ToryFolderDiff {
	private readonly _extraFilesOnFirst: ToryFile[];
	private readonly _extraFilesOnSecond: ToryFile[];
	private readonly _renamedFiles: ToryFilePair[];
	private readonly _modifiedFiles: ToryFilePair[];
	private readonly _unchangedFiles: ToryFilePair[];

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

		// We cannot compute unchangeds and renameds at the same doubleloop because
		// we might accidentally register two renames a->b and b->a for files a->b
		// that are identical and unchanged...
		for (const file1 of firstFiles) {
			for (const file2 of secondFiles) {
				if (
					file1.sameContents(file2) &&
					getRelativePath(file1, firstFolder) === getRelativePath(file2, secondFolder)
				) {
					remainingFirst.delete(file1);
					remainingSecond.delete(file2);
					unchangedFiles.add({ first: file1, second: file2 });
				}
			}
		}

		for (const file1 of [...remainingFirst]) {
			for (const file2 of [...remainingSecond]) {
				if (file1.sameContents(file2)) {
					// Surely they don't have the same relative paths, since they
					// would have already been picked in the doubleloop above.
					remainingFirst.delete(file1);
					remainingSecond.delete(file2);
					renamedFiles.add({ first: file1, second: file2 });
				}
			}
		}

		for (const file1 of [...remainingFirst]) {
			for (const file2 of [...remainingSecond]) {
				if (getRelativePath(file1, firstFolder) === getRelativePath(file2, secondFolder)) {
					remainingFirst.delete(file1);
					remainingSecond.delete(file2);
					// Surely they don't have the same contents, since they would
					// have already been picked in the doubleloop above.
					modifiedFiles.add({ first: file1, second: file2 });
				}
			}
		}

		this._extraFilesOnFirst = [...remainingFirst];
		this._extraFilesOnSecond = [...remainingSecond];
		this._renamedFiles = [...renamedFiles];
		this._modifiedFiles = [...modifiedFiles];
		this._unchangedFiles = [...unchangedFiles];
	}

	/**
	 * No particular order is guaranteed.
	 */
	get extraFilesOnFirst(): ToryFile[] {
		return this._extraFilesOnFirst.slice();
	}

	/**
	 * No particular order is guaranteed.
	 */
	get extraFilesOnSecond(): ToryFile[] {
		return this._extraFilesOnSecond.slice();
	}

	/**
	 * No particular order is guaranteed.
	 */
	get renamedFiles(): ToryFilePair[] {
		return this._renamedFiles.slice();
	}

	/**
	 * No particular order is guaranteed.
	 */
	get modifiedFiles(): ToryFilePair[] {
		return this._modifiedFiles.slice();
	}

	/**
	 * No particular order is guaranteed.
	 */
	get unchangedFiles(): ToryFilePair[] {
		return this._unchangedFiles.slice();
	}

	noDiffs(): boolean {
		return this._extraFilesOnFirst.length === 0 &&
			this._extraFilesOnSecond.length === 0 &&
			this._renamedFiles.length === 0 &&
			this._modifiedFiles.length === 0;
	}
}
