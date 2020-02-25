import { ToryFolder } from './tory-folder';
export { ToryFolder } from './tory-folder';
import { ToryFile } from './tory-file';
export { ToryFile } from './tory-file';

const tory = { ToryFile, ToryFolder };

export default tory;

// For CommonJS default export support
module.exports = tory;
module.exports.default = tory;
