import { basename, relative } from 'path';
import { Folder } from '../types';
import { describeFileAssumingExistence } from './describe-file';
import { describeOtherAssumingExistence } from './describe-other';
import { getCategorizedChildrenAbsolutePathsAssumingExistence } from './get-categorized-children-paths';

export interface DescribeFolderOptions {
	maxDepth?: number;
	skipSubfolder?(name: string, absolutePath: string): boolean;
}

function defaultSkipSubfolder(name: string): boolean {
	return ['.git', 'node_modules'].includes(name);
}

export function describeFolderAssumingExistence(
	folderAbsolutePath: string,
	referenceForRelativePaths: string,
	options: DescribeFolderOptions
): Folder {
	const maxDepth = options.maxDepth ?? Infinity;
	const skipSubfolder = options.skipSubfolder ?? defaultSkipSubfolder;

	const childrenPaths = getCategorizedChildrenAbsolutePathsAssumingExistence(folderAbsolutePath);

	const unskippedFolders: string[] = [];
	const skippedFolders: string[] = maxDepth === 0 ? childrenPaths.folderPaths : [];
	if (maxDepth > 0) {
		for (const folder of childrenPaths.folderPaths) {
			if (skipSubfolder(basename(folder), folder)) {
				skippedFolders.push(folder);
			} else {
				unskippedFolders.push(folder);
			}
		}
	}

	const resultFiles = childrenPaths.filePaths.map(path => {
		return describeFileAssumingExistence(path, referenceForRelativePaths);
	});
	const resultFolders = unskippedFolders.map(path => describeFolderAssumingExistence(
		path,
		referenceForRelativePaths,
		{
			maxDepth: maxDepth - 1,
			skipSubfolder
		})
	);
	const resultSkippedFolders = skippedFolders.map(path => ({
		name: basename(path),
		relativePath: relative(referenceForRelativePaths, path),
		absolutePath: path
	}));

	let totalChildrenSize = 0;
	let hasDeepSkippedFolder = false;

	for (const file of resultFiles) {
		totalChildrenSize += file.size;
	}

	for (const folder of resultFolders) {
		totalChildrenSize += folder.totalChildrenSize;
		if (!folder.hasDeepSkippedFolder) {
			hasDeepSkippedFolder = true;
		}
	}

	if (resultSkippedFolders.length > 0) {
		hasDeepSkippedFolder = true;
	}

	return {
		name: basename(folderAbsolutePath),
		relativePath: relative(referenceForRelativePaths, folderAbsolutePath),
		absolutePath: folderAbsolutePath,
		folders: resultFolders,
		skippedFolders: resultSkippedFolders,
		files: resultFiles,
		others: childrenPaths.otherPaths.map(path => describeOtherAssumingExistence(
			path,
			referenceForRelativePaths
		)),
		totalChildrenSize,
		hasDeepSkippedFolder
	};
}
