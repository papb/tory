# tory [![Build Status](https://travis-ci.com/papb/tory.svg?branch=master)](https://travis-ci.com/papb/tory)

> Your directory utility belt


## Install

```
$ npm install tory
```


## Usage

```js
const tory = require('tory');

tory.describeFolder('.');
```

Output:

```jsonc
{
	"name": "cwd-folder-name",
	"absolutePath": "/home/you/some/folder/cwd-folder-name",
	"folders": [
		/* an array of objects describing the children folders */
	],
	"skippedFolders": [
		/* an array of very simple objects describing the children folders that were skipped */
	],
	"files": [
		/* an array of objects describing the files in this folder */
	],
	"others": [
		/* an array of objects describing other objects in this folder (such as symlinks) */
	],
	"totalChildrenSize": 6310936, // in bytes
	"skippedSomething": true // whether or not some subfolder was skipped
}
```

## API

### tory.describeFolder(folderPath, [options])

Obtains a thorough JSON representation of the given folder (except for the actual contents of the files - only their sizes are reported).

#### folderPath

Type: `string`

The path to be inspected.

#### options

Type: `object`

##### maxDepth

Type: `number`\
Default: `Infinity`

The maximum depth to be recursed into.

* No recursion: `0`
* Look into the subfolders, but no further: `1`

##### skipFolder

Type: `(name?: string, absolutePath?: string): boolean`<br>
Default: `name => ['.git', 'node_modules'].includes(name)`

A callback called on every subfolder found. Its result determines whether or not to skip that subfolder.

## License

MIT © [Pedro Augusto de Paula Barbosa](https://github.com/papb)
