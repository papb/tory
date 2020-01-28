import { describeFolder } from './describe/describe-folder';
import { describeFile } from './describe/describe-file';
import { getCategorizedChildrenPaths } from './describe/get-categorized-children-paths';
import { compareFilesInFolders } from './compare/compare-files-in-folders';
import { getAllFilesRecursively } from './describe/get-all-files-recursively';

const tory = {
	describeFolder,
	describeFile,
	getCategorizedChildrenPaths,
	compareFilesInFolders,
	getAllFilesRecursively
};

export default tory;

// For CommonJS default export support
module.exports = tory;
module.exports.default = tory;
