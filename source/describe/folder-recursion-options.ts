export interface FolderRecursionOptions {
	maxDepth?: number;
	skipSubfolder?(name: string, absolutePath: string): boolean;
}

export function defaultSkipSubfolder(name: string): boolean {
	return ['.git', 'node_modules'].includes(name);
}

export function expandFolderRecursionOptions(options: FolderRecursionOptions = {}): Required<FolderRecursionOptions> {
	return {
		maxDepth: options.maxDepth ?? Infinity,
		skipSubfolder: options.skipSubfolder ?? defaultSkipSubfolder
	};
}
