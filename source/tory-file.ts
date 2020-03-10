import jetpack = require('fs-jetpack');
import { basename } from 'path';
import { ToryError } from './helpers/tory-error';
import { ToryFiler } from './helpers/tory-filer';

export class ToryFile implements ToryFiler {
	public readonly absolutePath: string;
	public readonly name: string;
	public readonly type = 'file';

	private _loaded = false;
	private _size?: number;
	private _sha256?: string;
	private _accessTime?: Date;
	private _modifyTime?: Date;
	private _changeTime?: Date;

	constructor(filePath: string) {
		const absolutePath = jetpack.path(filePath);
		const existence = jetpack.exists(absolutePath);
		if (existence !== 'file' && existence !== 'other') {
			throw new ToryError(`A file was not found at path "${filePath}" (which resolved to "${absolutePath}")`);
		}

		this.absolutePath = absolutePath;
		this.name = basename(absolutePath);
	}

	getSize(): number {
		this._loadIfNeeded();
		return this._size!;
	}

	getHash(): string {
		this._loadIfNeeded();
		return this._sha256!;
	}

	getAccessTime(): Date {
		this._loadIfNeeded();
		return this._accessTime!;
	}

	getModifyTime(): Date {
		this._loadIfNeeded();
		return this._modifyTime!;
	}

	getChangeTime(): Date {
		this._loadIfNeeded();
		return this._changeTime!;
	}

	load(): void {
		if (this._loaded) {
			const error = new ToryError('Attempted to load a ToryFile that was already loaded.');
			error.sourceInstance = this;
			throw error;
		}

		this._loadIfNeeded();
	}

	sameContents(other: ToryFile): boolean {
		return this.getSize() === other.getSize() && this.getHash() === other.getHash();
	}

	private _loadIfNeeded(): void {
		if (this._loaded) {
			return;
		}

		const inspection = jetpack.inspect(this.absolutePath, {
			checksum: 'sha256',
			times: true
		})!;

		try {
			this._size = inspection.size;
			this._sha256 = inspection.sha256!;
			this._accessTime = inspection.accessTime!;
			this._modifyTime = inspection.modifyTime!;
			this._changeTime = inspection.changeTime!;

			this._loaded = true;
		} catch (error) {
			const error2 = new ToryError(`Unable to load data from ${this.absolutePath}`);
			error2.innerError = error;
			throw error2;
		}
	}
}
