import jetpack = require('fs-jetpack');
import { sep } from 'path';
import { InspectResult } from 'fs-jetpack/types';

interface ErrorWithCode extends Error {
	code: string;
}

export interface File {
	name: string;
	absolutePath: string;
	size: number;
	sha256: string;
	accessTime: Date;
	modifyTime: Date;
	changeTime: Date;
}

export interface Other {
	name: string;
	absolutePath: string;
	jetpackInspectResult: InspectResult;
}

export interface SkippedFolder {
	name: string;
	absolutePath: string;
}

export interface Folder {
	name: string;
	absolutePath: string;
	totalChildrenSize: number;
	skippedSomething: boolean;
	folders: Folder[];
	skippedFolders: SkippedFolder[];
	files: File[];
	others: Other[];
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

interface DescribeFolderAssumingExistenceOptions {
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

function describeFolderAssumingExistence(folderAbsolutePath: string, options: DescribeFolderAssumingExistenceOptions): Folder {
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

	const result: Folder = {
		name: getNameFromPath(folderAbsolutePath),
		absolutePath: folderAbsolutePath,
		folders: unskippedFolders.map(path => describeFolderAssumingExistence(
			path,
			{
				maxDepth: maxDepth - 1,
				skipSubfolder
			})
		),
		skippedFolders: skippedFolders.map(path => ({
			name: getNameFromPath(path),
			absolutePath: path
		})),
		files: files.map(describeFileAssumingExistence),
		others: others.map(describeOtherAssumingExistence),
		totalChildrenSize: 0, // Populated below
		skippedSomething: false // Populated below
	};

	for (const file of result.files) {
		result.totalChildrenSize += file.size;
	}

	for (const folder of result.folders) {
		result.totalChildrenSize += folder.totalChildrenSize;
		if (!folder.skippedSomething) {
			result.skippedSomething = true;
		}
	}

	if (result.skippedFolders.length > 0) {
		result.skippedSomething = true;
	}

	return result;
}

export function describeFolder(folderPath: string, options?: DescribeFolderAssumingExistenceOptions): Folder {
	const folderAbsolutePath = jetpack.path(folderPath);
	if (jetpack.exists(folderAbsolutePath) !== 'dir') {
		const e = new Error(`Folder "${folderAbsolutePath}" not found.`) as ErrorWithCode;
		e.code = 'ENOENT';
		throw e;
	}

	return describeFolderAssumingExistence(folderAbsolutePath, options ?? {});
}
