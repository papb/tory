import { Folder, File } from '../types';
import { FolderRecursionOptions } from './folder-recursion-options';
import { describeFolder } from './describe-folder';

function _getAllFilesRecursively(folder: Folder): File[] {
	return folder.files.concat(...folder.folders.map(_getAllFilesRecursively));
}

export function getAllFilesRecursively(folderPath: string, options?: FolderRecursionOptions): File[] {
	return _getAllFilesRecursively(describeFolder(folderPath, options));
}
