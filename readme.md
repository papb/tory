# tory ![Build Status](https://github.com/papb/tory/workflows/CI/badge.svg)

> Your directory utility belt


## Install

```
$ npm install tory
```


## Usage

```js
const { ToryFile, ToryFolder } = require('tory');

// This example assumes your current working directory is this
// repo itself (although you can also pass absolute paths)
const source = new ToryFolder('source');

for (const filer of source) {
    // 'filer' is a term which means 'file or folder'
    console.log('Visited:', filer.name, `(${filer.type})`);
}
// Visited: index.ts (file)
// Visited: tory-file.ts (file)
// Visited: tory-folder.ts (file)
// Visited: helpers (folder)

for (const filer of source.toDefaultRecursiveIterable()) {
    console.log('Visited:', filer.name, `(${filer.type})`);
}
// Visited: index.ts (file)
// Visited: tory-file.ts (file)
// Visited: tory-folder.ts (file)
// Visited: helpers (folder)
// Visited: iterable-from-tory-folder.ts (file)
// Visited: sort-lexicographically.ts (file)
// Visited: tory-error.ts (file)
// Visited: tory-filer.ts (file)
// Visited: tory-folder-diff.ts (file)

const package = new ToryFile('package.json');
console.log('package.json - sha256:', package.getHash());
console.log('package.json - size (bytes):', package.getSize());
console.log('package.json - modify time:', package.getModifyTime());
// package.json - sha256: ce472d76d57b62c8e38993becd6d78fd11d6df2da800be8214a759c524edfcb4
// package.json - size (bytes): 1518
// package.json - modify time: 2020-02-24T00:23:30.617Z

const projectRoot = new ToryFolder('.');
const customProjectIterable = projectRoot.toIterable((folder, depth) => {
    if (depth > 4 || ['.git', 'node_modules', 'dist'].includes(folder.name)) {
        return 'yield';
    }
    return 'enter-immediately-then-yield';
});
for (const filer of customProjectIterable) {
    if (filer.type === 'file' && !filer.name.endsWith('.ts')) continue;
    console.log('Visited:', filer.name, `(${filer.type})`);
}
// Visited: .git (folder)
// Visited: dist (folder)
// Visited: node_modules (folder)
// Visited: index.ts (file)
// Visited: tory-file.ts (file)
// Visited: tory-folder.ts (file)
// Visited: iterable-from-tory-folder.ts (file)
// Visited: sort-lexicographically.ts (file)
// Visited: tory-error.ts (file)
// Visited: tory-filer.ts (file)
// Visited: tory-folder-diff.ts (file)
// Visited: helpers (folder)
// Visited: source (folder)
// Visited: test.ts (file)
// Visited: attempt-delete.ts (file)
// Visited: get-random-numbers-with-sum-constraint.ts (file)
// Visited: get-random-test-folder.ts (file)
// Visited: get-temp-jetpack.ts (file)
// Visited: shuffle-array-in-place.ts (file)
// Visited: helpers (folder)
// Visited: test (folder)
```

## TypeScript usage

Tory is written in TypeScript and comes with complete type declarations. This means that you will have great code completions right in your editor, and also means that you can use Tory perfectly with TypeScript:

```ts
import { ToryFile, ToryFolder } from 'tory';
// ...
```

## API

*Note: This API documentation is far from complete. However, the public methods are not too hard to understand from their name and arguments, so please take a look at the source code for [ToryFile](https://github.com/papb/tory/blob/master/source/tory-file.ts) and [ToryFolder](https://github.com/papb/tory/blob/master/source/tory-folder.ts) for more information. A full API documentation is coming soon.*

### new ToryFolder(folderPath)

Creates a new ToryFolder instance representing the folder in the given path. This constructor throws if a folder cannot be found in the given path.

This constructor is very fast, since it does not perform any disk operations at all (except for checking the existence of the folder). In Tory, everything is [Lazy Loaded](https://en.wikipedia.org/wiki/Lazy_loading) (i.e. loaded only when you really need it).

#### folderPath

Type: `string`

### new ToryFile(filePath)

Creates a new ToryFile instance representing the file in the given path. This constructor throws if a file cannot be found in the given path.

This constructor is very fast, since it does not perform any disk operations at all (except for checking the existence of the file). In Tory, everything is [Lazy Loaded](https://en.wikipedia.org/wiki/Lazy_loading) (i.e. loaded only when you really need it).

#### filePath

Type: `string`

The path to the file. It can be an absolute path or a relative path to `process.cwd()`. In windows, both `/` and `\` are accepted as path separators.

## License

MIT © [Pedro Augusto de Paula Barbosa](https://github.com/papb)
