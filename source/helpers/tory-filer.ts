export interface ToryFiler {
	readonly absolutePath: string;
	readonly name: string;
	readonly type: 'file' | 'folder';
	getSha256(): string;
	getSize(): number;
}
