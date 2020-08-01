export interface ToryFiler {
	readonly absolutePath: string;
	readonly name: string;
	readonly type: 'file' | 'folder';
	getHash: () => string;
	getSize: () => number;
}
