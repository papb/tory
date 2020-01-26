import jetpack = require('fs-jetpack');
import { sortLexicographically } from './sort-lexicographically';

export interface CategorizedAbsolutePaths {
	readonly folderPaths: string[];
	readonly filePaths: string[];
	readonly otherPaths: string[];
}

export function listAbsolutePathsInFolderAssumingExistence(folderAbsolutePath: string): string[] {
	const names = jetpack.list(folderAbsolutePath) as string[];
	const paths = names.map(name => jetpack.path(folderAbsolutePath, name));
	sortLexicographically(paths);
	return paths;
}

export function getCategorizedPathsFromFolderAssumingExistence(folderAbsolutePath: string): CategorizedAbsolutePaths {
	const absolutePaths = listAbsolutePathsInFolderAssumingExistence(folderAbsolutePath);

	const folders: string[] = [];
	const files: string[] = [];
	const others: string[] = [];
	for (const path of absolutePaths) {
		const type = jetpack.exists(path);
		if (type === 'dir') {
			folders.push(path);
		} else if (type === 'file') {
			files.push(path);
		} else {
			others.push(path);
		}
	}

	return {
		folderPaths: folders,
		filePaths: files,
		otherPaths: others
	};
}
