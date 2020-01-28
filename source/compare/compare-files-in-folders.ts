import jetpack = require('fs-jetpack');
import { describeFolderAssumingExistence } from '../describe/describe-folder';
import { FileCollectionDiff } from '../types';
import { assertExistence } from '../helpers/assert-existence';
import { getFileCollectionDiff } from './get-file-collection-diff';

export function compareFilesInFoldersAssumingExistence(firstFolderPath: string, secondFolderPath: string): FileCollectionDiff {
	const beforeDescription = describeFolderAssumingExistence(firstFolderPath, firstFolderPath, { maxDepth: 0 });
	const afterDescription = describeFolderAssumingExistence(secondFolderPath, secondFolderPath, { maxDepth: 0 });
	return getFileCollectionDiff(beforeDescription.files, afterDescription.files);
}

export function compareFilesInFolders(firstFolderPath: string, secondFolderPath: string): FileCollectionDiff {
	assertExistence(firstFolderPath, 'dir');
	assertExistence(secondFolderPath, 'dir');
	return compareFilesInFoldersAssumingExistence(
		jetpack.path(firstFolderPath),
		jetpack.path(secondFolderPath)
	);
}
