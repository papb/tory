import tempy = require('tempy');
import jetpack = require('fs-jetpack');
import { FSJetpack } from 'fs-jetpack/types';

export function getTempJetpack(): FSJetpack {
	return jetpack.cwd(tempy.directory());
}
