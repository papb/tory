import jetpack = require('fs-jetpack');
import { ExistsResult } from 'fs-jetpack/types';

interface SimpleFolderDescriptor {
	[key: string]: ExistsResult;
}

function toFolderDescriptor(folderPath?: string): SimpleFolderDescriptor {
	folderPath = folderPath || '.';
	if (jetpack.exists(folderPath) !== 'dir') {
		throw new Error(`'${jetpack.path(folderPath)}' either does not exist or is not a directory.`);
	}

	const files = jetpack.list(folderPath || '.') as string[];
	const result: SimpleFolderDescriptor = {};
	for (const file of files) {
		result[file] = jetpack.exists(file);
	}

	return result;
}

export default function tory(folderPath?: string): SimpleFolderDescriptor {
	if (typeof folderPath !== 'undefined' && typeof folderPath !== 'string') {
		throw new TypeError(`Expected a string or undefined, got ${typeof folderPath}`);
	}

	return toFolderDescriptor(folderPath);
}

// For CommonJS default export support
module.exports = tory;
module.exports.default = tory;
