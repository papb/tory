import { describeFolder, describeFile, getCategorizedChildrenPaths } from './describe';
import { compareFilesInFolders } from './compare';

const tory = { describeFolder, describeFile, getCategorizedChildrenPaths, compareFilesInFolders };

export default tory;

// For CommonJS default export support
module.exports = tory;
module.exports.default = tory;
