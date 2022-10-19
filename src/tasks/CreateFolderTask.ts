import * as fs from "fs-extra";


export const CreateFolderTask = (path: string) => async () => {
	await fs.ensureDir(path);
}
