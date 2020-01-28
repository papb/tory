import { describeFolder } from './describe/describe-folder';
import { describeFile } from './describe/describe-file';
import { getCategorizedChildrenPaths } from './describe/get-categorized-children-paths';
import { compareFilesInFolders } from './compare/compare-files-in-folders';

const tory = {
	describeFolder,
	describeFile,
	getCategorizedChildrenPaths,
	compareFilesInFolders
};

export default tory;

// For CommonJS default export support
module.exports = tory;
module.exports.default = tory;
