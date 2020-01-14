# tory [![Build Status](https://travis-ci.com/papb/tory.svg?branch=master)](https://travis-ci.com/papb/tory)

> Your directory utility belt


## Install

```
$ npm install tory
```


## Usage

```js
const tory = require('tory');

tory('.');
//=> {
//   "package.json": "file",
//   "readme.md": "file",
//   "source": "dir"
// }
```


## API

### tory([folderPath])

#### folderPath

Type: `string`\
Default: `'.'`

Returns an object describing the contents of the folder in the given path.


## License

MIT © [Pedro Augusto de Paula Barbosa](https://github.com/papb)
