import jetpack = require('fs-jetpack');
import { basename, relative } from 'path';
import { InspectResult } from 'fs-jetpack/types';
import { getCategorizedPathsFromFolderAssumingExistence } from './helpers/folder-inspector';

interface ErrorWithCode extends Error {
	code: string;
}

/* Anything that is a File, Folder, Other, Etc */
export interface Filer {
	readonly name: string;
	readonly relativePath: string;
	readonly absolutePath: string;
}

export interface File extends Filer {
	readonly size: number;
	readonly sha256: string;
	readonly accessTime: Date;
	readonly modifyTime: Date;
	readonly changeTime: Date;
}

export interface Other extends Filer {
	readonly jetpackInspectResult: InspectResult;
}

export interface SkippedFolder extends Filer {}

export interface Folder extends Filer {
	readonly totalChildrenSize: number;
	readonly hasDeepSkippedFolder: boolean;
	readonly folders: Folder[];
	readonly skippedFolders: SkippedFolder[];
	readonly files: File[];
	readonly others: Other[];
}

function describeOtherAssumingExistence(otherPath: string, referencePath: string): Other {
	return {
		name: basename(otherPath),
		relativePath: relative(referencePath, otherPath),
		absolutePath: otherPath,
		jetpackInspectResult: jetpack.inspect(otherPath, {
			checksum: 'sha256',
			times: true
		}) as InspectResult
	};
}

function describeFileAssumingExistence(filePath: string, referencePath: string): File {
	const inspection = jetpack.inspect(filePath, {
		checksum: 'sha256',
		times: true
	}) as InspectResult;

	return {
		name: basename(filePath),
		relativePath: relative(referencePath, filePath),
		absolutePath: filePath,
		size: inspection.size,
		sha256: inspection.sha256 as string,
		accessTime: inspection.accessTime as Date,
		modifyTime: inspection.modifyTime as Date,
		changeTime: inspection.changeTime as Date
	};
}

export interface DescribeFolderOptions {
	maxDepth?: number;
	skipSubfolder?(name: string, absolutePath: string): boolean;
}

function defaultSkipSubfolder(name: string): boolean {
	return ['.git', 'node_modules'].includes(name);
}

function describeFolderAssumingExistence(
	folderAbsolutePath: string,
	referenceForRelativePaths: string,
	options: DescribeFolderOptions
): Folder {
	const maxDepth = options.maxDepth ?? Infinity;
	const skipSubfolder = options.skipSubfolder ?? defaultSkipSubfolder;

	const contentPaths = getCategorizedPathsFromFolderAssumingExistence(folderAbsolutePath);

	const unskippedFolders: string[] = [];
	const skippedFolders: string[] = maxDepth === 0 ? contentPaths.folderPaths : [];
	if (maxDepth > 0) {
		for (const folder of contentPaths.folderPaths) {
			if (skipSubfolder(basename(folder), folder)) {
				skippedFolders.push(folder);
			} else {
				unskippedFolders.push(folder);
			}
		}
	}

	const resultFiles = contentPaths.filePaths.map(path => {
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
		others: contentPaths.otherPaths.map(path => describeOtherAssumingExistence(
			path,
			referenceForRelativePaths
		)),
		totalChildrenSize,
		hasDeepSkippedFolder
	};
}

export function describeFolder(folderPath: string, options?: DescribeFolderOptions): Folder {
	const folderAbsolutePath = jetpack.path(folderPath);
	if (jetpack.exists(folderAbsolutePath) !== 'dir') {
		const e = new Error(`Folder "${folderAbsolutePath}" not found.`) as ErrorWithCode;
		e.code = 'ENOENT';
		throw e;
	}

	return describeFolderAssumingExistence(folderAbsolutePath, folderAbsolutePath, options ?? {});
}
