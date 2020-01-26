import jetpack = require('fs-jetpack');

interface ErrorWithCode extends Error {
	code: string;
}

export function assertExistence(path: string, objectType: 'file' | 'dir'): void {
	const absolutePath = jetpack.path(path);
	if (jetpack.exists(absolutePath) !== objectType) {
		const e = new Error(`${objectType === 'file' ? 'File' : 'Folder'} not found at "${absolutePath}".`) as ErrorWithCode;
		e.code = 'ENOENT';
		throw e;
	}
}
