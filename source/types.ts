import { InspectResult } from 'fs-jetpack/types';

export interface CategorizedPaths {
	readonly folderPaths: string[];
	readonly filePaths: string[];
	readonly otherPaths: string[];
	readonly allPaths: string[];
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

export type FilePair = { first: File; second: File };

export interface FileCollectionDiff {
	readonly extraFilesOnFirst: Iterable<File>;
	readonly extraFilesOnSecond: Iterable<File>;
	readonly renamedFiles: Iterable<FilePair>;
	readonly modifiedFiles: Iterable<FilePair>;
	readonly unchangedFiles: Iterable<FilePair>;
}
