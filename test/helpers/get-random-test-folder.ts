import tempy = require('tempy');
import jetpack = require('fs-jetpack');
import { getRandomNumbersWithSumConstraint } from './get-random-numbers-with-sum-constraint';

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

	// Write shallow files
	for (let i = 0; i < shallowFileCount; i++) {
		const fileName = `${Math.random()}`;
		await jetpack.writeAsync(jetpack.path(folderAbsolutePath, fileName), `${Math.random()}`);
		fileNames.push(fileName);
	}

	// Recursive calls for subfolders
	for (const count of subfolderFileCounts) {
		const subfolderAbsolutePath = jetpack.path(folderAbsolutePath, `${Math.random()}`);
		await jetpack.dirAsync(subfolderAbsolutePath);
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
