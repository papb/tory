import jetpack = require('fs-jetpack');
import { assertExistence } from '../helpers/assert-existence';
import { File, Folder, CategorizedPaths } from '../types';
import { DescribeFolderOptions, describeFolderAssumingExistence } from './describe-folder';
import { describeFileAssumingExistence } from './describe-file';
import { getCategorizedChildrenAbsolutePathsAssumingExistence } from './get-categorized-children-paths';

export function describeFolder(folderPath: string, options?: DescribeFolderOptions): Folder {
	assertExistence(folderPath, 'dir');
	const folderAbsolutePath = jetpack.path(folderPath);
	return describeFolderAssumingExistence(folderAbsolutePath, folderAbsolutePath, options ?? {});
}

export function describeFile(filePath: string): File {
	assertExistence(filePath, 'file');
	const fileAbsolutePath = jetpack.path(filePath);
	return describeFileAssumingExistence(fileAbsolutePath, fileAbsolutePath);
}

export function getCategorizedChildrenPaths(folderPath: string): CategorizedPaths {
	assertExistence(folderPath, 'dir');
	const folderAbsolutePath = jetpack.path(folderPath);
	return getCategorizedChildrenAbsolutePathsAssumingExistence(folderAbsolutePath);
}
