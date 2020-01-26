import jetpack = require('fs-jetpack');
import { FileCollectionDiff } from '../types';
import { assertExistence } from '../helpers/assert-existence';
import { compareFilesInFoldersAssumingExistence } from './compare-files-in-folders';

export function compareFilesInFolders(firstFolderPath: string, secondFolderPath: string): FileCollectionDiff {
	assertExistence(firstFolderPath, 'dir');
	assertExistence(secondFolderPath, 'dir');
	return compareFilesInFoldersAssumingExistence(
		jetpack.path(firstFolderPath),
		jetpack.path(secondFolderPath)
	);
}
