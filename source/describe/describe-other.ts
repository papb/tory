import jetpack = require('fs-jetpack');
import { basename, relative } from 'path';
import { InspectResult } from 'fs-jetpack/types';
import { Other } from '../types';

export function describeOtherAssumingExistence(otherPath: string, referencePath: string): Other {
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
