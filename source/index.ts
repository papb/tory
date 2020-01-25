import { describeFolder } from './describe-folder';
import { compareFilesInFolders } from './compare/compare-files-in-folders';

const tory = { describeFolder, compareFilesInFolders };

export default tory;

// For CommonJS default export support
module.exports = tory;
module.exports.default = tory;
