import tempy = require('tempy');
import jetpack = require('fs-jetpack');
import { getRandomNumbersWithSumConstraint } from './get-random-numbers-with-sum-constraint';
import { RandomStringBuilder } from './random-string-builder';

interface RandomTestFolderInfo {
	fileNames: string[];
	folderNames: string[];
	path: string;
}

interface RandomFolderCreationInfo {
	fileNames: string[];
	folderNames: string[];
}

async function fillFolderRandomly(folderAbsolutePath: string, amountOfFiles: number): Promise<RandomFolderCreationInfo> {
	/* eslint-disable no-await-in-loop */
	const fileNames: string[] = [];
	const folderNames: string[] = [];

	if (amountOfFiles <= 0) {
		return { fileNames, folderNames };
	}

	const amountOfSubfolders = amountOfFiles <= 2 ? 0 : Math.floor(5 * Math.random());
	const randomFileCounts = getRandomNumbersWithSumConstraint(1 + amountOfSubfolders, amountOfFiles);
	const [shallowFileCount, ...subfolderFileCounts] = randomFileCounts;

	const randomNameMaker = new RandomStringBuilder(0); // Names cannot repeat!
	const randomContentMaker = new RandomStringBuilder(0.25);

	// Write shallow files
	for (let i = 0; i < shallowFileCount; i++) {
		const fileName = randomNameMaker.next();
		await jetpack.writeAsync(
			jetpack.path(folderAbsolutePath, fileName),
			randomContentMaker.next()
		);
		fileNames.push(fileName);
	}

	// Recursive calls for subfolders
	for (const count of subfolderFileCounts) {
		const folderName = randomNameMaker.next();
		const subfolderAbsolutePath = jetpack.path(folderAbsolutePath, folderName);
		await jetpack.dirAsync(subfolderAbsolutePath);
		folderNames.push(folderName);
		const innerResult = await fillFolderRandomly(subfolderAbsolutePath, count);
		fileNames.push(...innerResult.fileNames);
		folderNames.push(...innerResult.folderNames);
	}

	return { fileNames, folderNames };
	/* eslint-enable no-await-in-loop */
}

export async function getRandomTestFolder(amountOfFiles: number): Promise<RandomTestFolderInfo> {
	if (amountOfFiles <= 0) {
		throw new Error(`Invalid amount of files: ${amountOfFiles}`);
	}

	const path = tempy.directory();

	const { fileNames, folderNames } = await fillFolderRandomly(path, amountOfFiles);

	return { fileNames, folderNames, path };
}
