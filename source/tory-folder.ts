import jetpack = require('fs-jetpack');
import { basename } from 'path';
import { sortLexicographically } from './helpers/sort-lexicographically';
import { ToryError } from './helpers/tory-error';
import { ToryFile } from './tory-file';
import { ToryFiler } from './helpers/tory-filer';
import { iterableFromToryFolder, RecursionDecider } from './helpers/iterable-from-tory-folder';
import { ToryFolderDiff } from './helpers/tory-folder-diff';
import hasha = require('hasha');

export class ToryFolder implements ToryFiler {
	public readonly absolutePath: string;
	public readonly name: string;
	public readonly type = 'folder';

	private _shallowLoaded = false;
	private readonly _subfolders: ToryFolder[] = [];
	private readonly _files: ToryFile[] = [];
	private _sha256?: string;
	private _size?: number;

	constructor(folderPath: string) {
		const absolutePath = jetpack.path(folderPath);
		const existence = jetpack.exists(absolutePath);
		if (existence !== 'dir') {
			throw new ToryError(`A folder was not found at path "${folderPath}" (which resolved to "${absolutePath}")`);
		}

		this.absolutePath = absolutePath;
		this.name = basename(absolutePath);
	}

	getSubfolders(): ToryFolder[] {
		this._shallowLoadIfNeeded();
		return this._subfolders.slice();
	}

	getFiles(): ToryFile[] {
		this._shallowLoadIfNeeded();
		return this._files.slice();
	}

	getFilers(): ToryFiler[] {
		return [...this];
	}

	getSha256(): string {
		if (!this._sha256) {
			const shas: string[] = ['tory-pepper'];
			for (const filer of this) {
				shas.push(filer.getSha256());
			}

			this._sha256 = hasha(shas.join(''), { algorithm: 'sha256' });
		}

		return this._sha256;
	}

	getSize(): number {
		if (!this._size) {
			let size = 0;
			for (const filer of this) {
				size += filer.getSize();
			}

			this._size = size;
		}

		return this._size;
	}

	* [Symbol.iterator](): IterableIterator<ToryFiler> {
		yield * (this.getFiles() as ToryFiler[]).concat(this.getSubfolders() as ToryFiler[]);
	}

	toDefaultRecursiveIterable(): Iterable<ToryFiler> {
		const decider: RecursionDecider = folder => {
			return folder.name === 'node_modules' ? 'yield' : 'yield-then-enter-immediately';
		};

		return iterableFromToryFolder(this, decider);
	}

	toDFSFilesRecursiveIterable(): Iterable<ToryFile> {
		const decider: RecursionDecider = folder => {
			return folder.name === 'node_modules' ? 'skip' : 'enter-immediately';
		};

		return iterableFromToryFolder(this, decider) as Iterable<ToryFile>;
	}

	toBFSFilesRecursiveIterable(): Iterable<ToryFile> {
		const decider: RecursionDecider = folder => {
			return folder.name === 'node_modules' ? 'skip' : 'enter-lastly';
		};

		return iterableFromToryFolder(this, decider) as Iterable<ToryFile>;
	}

	toIterable(decider: RecursionDecider): Iterable<ToryFiler> {
		return iterableFromToryFolder(this, decider);
	}

	compare(other: ToryFolder, recursionDecider?: RecursionDecider): ToryFolderDiff {
		return new ToryFolderDiff(this, other, recursionDecider);
	}

	private _shallowLoadIfNeeded(): void {
		if (this._shallowLoaded) {
			return;
		}

		const childNames = jetpack.list(this.absolutePath)!;
		const childPaths = childNames.map(name => jetpack.path(this.absolutePath, name));
		sortLexicographically(childPaths);

		for (const path of childPaths) {
			if (jetpack.exists(path) === 'dir') {
				this._subfolders.push(new ToryFolder(path));
			} else {
				const file = new ToryFile(path);
				this._files.push(file);
			}
		}

		this._shallowLoaded = true;
	}
}
