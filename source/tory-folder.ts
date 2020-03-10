import jetpack = require('fs-jetpack');
import { basename } from 'path';
import { sortLexicographically } from './helpers/sort-lexicographically';
import { ToryError } from './helpers/tory-error';
import { ToryFile } from './tory-file';
import { ToryFiler } from './helpers/tory-filer';
import { iterableFromToryFolder, RecursionDecider } from './helpers/iterable-from-tory-folder';
import { ToryFolderDiff } from './helpers/tory-folder-diff';
import { hashMultiple } from './helpers/hash-multiple';

export class ToryFolder implements ToryFiler {
	public readonly absolutePath: string;
	public readonly name: string;
	public readonly type = 'folder';

	private _shallowLoaded = false;
	private readonly _subfolders: ToryFolder[] = [];
	private readonly _files: ToryFile[] = [];
	private _shallowHash?: string;
	private _deepHash?: string;
	private _shallowSize?: number;
	private _deepSize?: number;

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

	getHash({ deep = true } = {}): string {
		// Note: don't change the default value of `deep` before looking at tory-filer.ts
		return deep ? this._getDeepHash() : this._getShallowHash();
	}

	getSize({ deep = true } = {}): number {
		// Note: don't change the default value of `deep` before looking at tory-filer.ts
		return deep ? this._getDeepSize() : this._getShallowSize();
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

	compareFilesShallow(other: ToryFolder): ToryFolderDiff {
		return new ToryFolderDiff(this, other, () => 'yield');
	}

	compareFiles(other: ToryFolder, recursionDecider?: RecursionDecider): ToryFolderDiff {
		return new ToryFolderDiff(this, other, recursionDecider);
	}

	sameContentsShallow(other: ToryFolder): boolean {
		return this.getHash({ deep: false }) === other.getHash({ deep: false });
	}

	sameContentsDeep(other: ToryFolder): boolean {
		return this.getHash({ deep: true }) === other.getHash({ deep: true });
	}

	private _shallowLoadIfNeeded(): void {
		if (this._shallowLoaded) {
			return;
		}

		const childNames = jetpack.list(this.absolutePath)!;
		let childPaths = childNames.map(name => jetpack.path(this.absolutePath, name));
		childPaths = sortLexicographically(childPaths);

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

	private _computeShallowHashIfNeeded(): void {
		if (this._shallowHash) {
			return;
		}

		this._shallowLoadIfNeeded();

		const fileNames = this._files.map(x => x.name);
		const fileHashes = this._files.map(x => x.getHash());
		const subfolderNames = this._subfolders.map(x => x.name);

		this._shallowHash = hashMultiple(
			hashMultiple(...fileNames),
			hashMultiple(...fileHashes),
			hashMultiple(...subfolderNames)
		);
	}

	private _computeDeepHashIfNeeded(): void {
		if (this._deepHash) {
			return;
		}

		this._computeShallowHashIfNeeded();

		this._deepHash = hashMultiple(
			this._shallowHash!,
			...this._subfolders.map(x => x.getHash({ deep: true }))
		);
	}

	private _getShallowHash(): string {
		this._computeShallowHashIfNeeded();
		return this._shallowHash!;
	}

	private _getDeepHash(): string {
		this._computeDeepHashIfNeeded();
		return this._deepHash!;
	}

	private _computeShallowSizeIfNeeded(): void {
		if (this._shallowSize) {
			return;
		}

		this._shallowLoadIfNeeded();

		this._shallowSize = 0;
		for (const file of this._files) {
			this._shallowSize += file.getSize();
		}
	}

	private _computeDeepSizeIfNeeded(): void {
		if (this._deepSize) {
			return;
		}

		this._computeShallowSizeIfNeeded();

		this._deepSize = this._shallowSize!;
		for (const subfolder of this._subfolders) {
			this._deepSize += subfolder.getSize({ deep: true });
		}
	}

	private _getShallowSize(): number {
		this._computeShallowSizeIfNeeded();
		return this._shallowSize!;
	}

	private _getDeepSize(): number {
		this._computeDeepSizeIfNeeded();
		return this._deepSize!;
	}
}
