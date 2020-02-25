import { ToryFolder } from '../tory-folder';
import { ToryFiler } from './tory-filer';

export type StrategyDeciderOutput =
	'yield-then-enter-immediately' |
	'enter-immediately-then-yield' |
	'yield-then-enter-lastly' |
	'yield' |
	'enter-immediately' |
	'enter-lastly' |
	'skip' |
	'yield-then-break' |
	'break';

export type RecursionDecider = (folder: ToryFolder, depth: number, rootFolder: ToryFolder) => StrategyDeciderOutput;

export function iterableFromToryFolder(rootFolder: ToryFolder, decider: RecursionDecider, baseDepth = 0): Iterable<ToryFiler> {
	return {
		* [Symbol.iterator]() {
			const postponedFolderRecursions: ToryFolder[] = [];
			for (const filer of rootFolder) {
				if (filer instanceof ToryFolder) {
					const decision = decider(filer, baseDepth, rootFolder);
					if (decision === 'yield-then-enter-immediately') {
						yield filer;
						yield * iterableFromToryFolder(filer, decider, baseDepth + 1);
					} else if (decision === 'enter-immediately-then-yield') {
						yield * iterableFromToryFolder(filer, decider, baseDepth + 1);
						yield filer;
					} else if (decision === 'yield-then-enter-lastly') {
						yield filer;
						postponedFolderRecursions.push(filer);
					} else if (decision === 'yield') {
						yield filer;
					} else if (decision === 'enter-immediately') {
						yield * iterableFromToryFolder(filer, decider, baseDepth + 1);
					} else if (decision === 'enter-lastly') {
						postponedFolderRecursions.push(filer);
					} else if (decision === 'yield-then-break') {
						yield filer;
						return;
					} else if (decision === 'break') {
						return;
					} else {
						// Do nothing, since `decision === 'skip'`.
					}
				} else {
					yield filer;
				}
			}

			for (const folder of postponedFolderRecursions) {
				yield * iterableFromToryFolder(folder, decider, baseDepth + 1);
			}
		}
	};
}
