import { describeFolder } from "../describe-folder";
import { getFileCollectionDiff, FileCollectionDiff } from "./get-file-collection-diff";

export function compareFilesInFolders(firstFolderPath: string, secondFolderPath: string): FileCollectionDiff {
    // describeFolder already checks for existence
    const beforeDescription = describeFolder(firstFolderPath, { maxDepth: 0 });
    const afterDescription = describeFolder(secondFolderPath, { maxDepth: 0 });
    return getFileCollectionDiff(beforeDescription.files, afterDescription.files);
}