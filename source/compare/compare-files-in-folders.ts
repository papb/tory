import { describeFolderAssumingExistence } from '../describe/describe-folder';
import { FileCollectionDiff } from '../types';
import { getFileCollectionDiff } from './get-file-collection-diff';

export function compareFilesInFoldersAssumingExistence(firstFolderPath: string, secondFolderPath: string): FileCollectionDiff {
	const beforeDescription = describeFolderAssumingExistence(firstFolderPath, firstFolderPath, { maxDepth: 0 });
	const afterDescription = describeFolderAssumingExistence(secondFolderPath, secondFolderPath, { maxDepth: 0 });
	return getFileCollectionDiff(beforeDescription.files, afterDescription.files);
}
