import jetpack = require('fs-jetpack');
import { sep } from 'path';
import { InspectResult } from 'fs-jetpack/types';

interface ErrorWithCode extends Error {
	code: string;
}

export interface File {
	readonly name: string;
	readonly absolutePath: string;
	readonly size: number;
	readonly sha256: string;
	readonly accessTime: Date;
	readonly modifyTime: Date;
	readonly changeTime: Date;
}

export interface Other {
	readonly name: string;
	readonly absolutePath: string;
	readonly jetpackInspectResult: InspectResult;
}

export interface SkippedFolder {
	readonly name: string;
	readonly absolutePath: string;
}

export interface Folder {
	readonly name: string;
	readonly absolutePath: string;
	readonly totalChildrenSize: number;
	readonly skippedSomething: boolean;
	readonly folders: Folder[];
	readonly skippedFolders: SkippedFolder[];
	readonly files: File[];
	readonly others: Other[];
}

function describeOtherAssumingExistence(otherPath: string): Other {
	const inspection = jetpack.inspect(otherPath, {
		checksum: 'sha256',
		times: true
	}) as InspectResult;

	const result: Other = {
		name: getNameFromPath(otherPath),
		absolutePath: otherPath,
		jetpackInspectResult: inspection
	};

	return result;
}

function describeFileAssumingExistence(filePath: string): File {
	const inspection = jetpack.inspect(filePath, {
		checksum: 'sha256',
		times: true
	}) as InspectResult;

	const result: File = {
		name: inspection.name,
		absolutePath: filePath,
		size: inspection.size,
		sha256: inspection.sha256 as string,
		accessTime: inspection.accessTime as Date,
		modifyTime: inspection.modifyTime as Date,
		changeTime: inspection.changeTime as Date
	};

	return result;
}

export interface DescribeFolderOptions {
	maxDepth?: number;
	skipSubfolder?(name: string, absolutePath: string): boolean;
}

function getNameFromPath(path: string): string {
	const lastIndex = path.lastIndexOf(sep);
	if (lastIndex === -1) {
		return path;
	}

	return path.slice(lastIndex + 1);
}

function defaultSkipSubfolder(name: string): boolean {
	return ['.git', 'node_modules'].includes(name);
}

function describeFolderAssumingExistence(folderAbsolutePath: string, options: DescribeFolderOptions): Folder {
	const maxDepth = options.maxDepth ?? Infinity;
	const skipSubfolder = options.skipSubfolder ?? defaultSkipSubfolder;

	const names = jetpack.list(folderAbsolutePath) as string[];
	const paths = names.map(name => jetpack.path(folderAbsolutePath, name));
	paths.sort((a, b) => {
		a = a.toUpperCase();
		b = b.toUpperCase();
		if (a < b) {
			return -1;
		}

		return a > b ? 1 : 0;
	});

	const folders: string[] = [];
	const files: string[] = [];
	const others: string[] = [];
	for (const path of paths) {
		const type = jetpack.exists(path);
		if (type === 'dir') {
			folders.push(path);
		} else if (type === 'file') {
			files.push(path);
		} else {
			others.push(path);
		}
	}

	const unskippedFolders: string[] = [];
	const skippedFolders: string[] = maxDepth === 0 ? folders : [];
	if (maxDepth > 0) {
		for (const folder of folders) {
			if (skipSubfolder(getNameFromPath(folder), folder)) {
				skippedFolders.push(folder);
			} else {
				unskippedFolders.push(folder);
			}
		}
	}

	const resultFiles = files.map(describeFileAssumingExistence);
	const resultFolders = unskippedFolders.map(path => describeFolderAssumingExistence(
		path,
		{
			maxDepth: maxDepth - 1,
			skipSubfolder
		})
	);
	const resultSkippedFolders = skippedFolders.map(path => ({
		name: getNameFromPath(path),
		absolutePath: path
	}));

	let totalChildrenSize = 0;
	let skippedSomething = false;

	for (const file of resultFiles) {
		totalChildrenSize += file.size;
	}

	for (const folder of resultFolders) {
		totalChildrenSize += folder.totalChildrenSize;
		if (!folder.skippedSomething) {
			skippedSomething = true;
		}
	}

	if (resultSkippedFolders.length > 0) {
		skippedSomething = true;
	}

	return {
		name: getNameFromPath(folderAbsolutePath),
		absolutePath: folderAbsolutePath,
		folders: resultFolders,
		skippedFolders: resultSkippedFolders,
		files: resultFiles,
		others: others.map(describeOtherAssumingExistence),
		totalChildrenSize: totalChildrenSize,
		skippedSomething
	};
}

export function describeFolder(folderPath: string, options?: DescribeFolderOptions): Folder {
	const folderAbsolutePath = jetpack.path(folderPath);
	if (jetpack.exists(folderAbsolutePath) !== 'dir') {
		const e = new Error(`Folder "${folderAbsolutePath}" not found.`) as ErrorWithCode;
		e.code = 'ENOENT';
		throw e;
	}

	return describeFolderAssumingExistence(folderAbsolutePath, options ?? {});
}
