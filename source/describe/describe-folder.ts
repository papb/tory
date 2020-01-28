import jetpack = require('fs-jetpack');
import { basename, relative } from 'path';
import { Folder } from '../types';
import { assertExistence } from '../helpers/assert-existence';
import { describeFileAssumingExistence } from './describe-file';
import { describeOtherAssumingExistence } from './describe-other';
import { getCategorizedChildrenAbsolutePathsAssumingExistence } from './get-categorized-children-paths';
import { FolderRecursionOptions, expandFolderRecursionOptions } from './folder-recursion-options';

export function describeFolderAssumingExistence(
	folderAbsolutePath: string,
	referenceForRelativePaths: string,
	options?: FolderRecursionOptions
): Folder {
	const { maxDepth, skipSubfolder } = expandFolderRecursionOptions(options);

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

export function describeFolder(folderPath: string, options?: FolderRecursionOptions): Folder {
	assertExistence(folderPath, 'dir');
	const folderAbsolutePath = jetpack.path(folderPath);
	return describeFolderAssumingExistence(folderAbsolutePath, folderAbsolutePath, options);
}
