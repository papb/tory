import jetpack = require('fs-jetpack');
import { basename, relative } from 'path';
import { InspectResult } from 'fs-jetpack/types';
import { File } from '../types';

export function describeFileAssumingExistence(filePath: string, referencePath: string): File {
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
