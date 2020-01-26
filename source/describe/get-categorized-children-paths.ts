import jetpack = require('fs-jetpack');
import { sortLexicographically } from '../helpers/sort-lexicographically';
import { CategorizedPaths } from '../types';

function getChildrenAbsolutePaths(folderAbsolutePath: string): string[] {
	const names = jetpack.list(folderAbsolutePath) as string[];
	const paths = names.map(name => jetpack.path(folderAbsolutePath, name));
	sortLexicographically(paths);
	return paths;
}

export function getCategorizedChildrenAbsolutePathsAssumingExistence(folderAbsolutePath: string): CategorizedPaths {
	const absolutePaths = getChildrenAbsolutePaths(folderAbsolutePath);

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
		otherPaths: others,
		allPaths: absolutePaths
	};
}
