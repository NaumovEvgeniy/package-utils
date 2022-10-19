import * as fs from "fs/promises";

export type Options = {
	skipCheck?: boolean
}

export const DeleteFolderTask = (path: string, options?: Options) => async () => {
	try {
		await fs.rm(path, {
			recursive: true,
		})
		return true;
	} catch (e) {
		if(options?.skipCheck){
			return false;
		}
		throw e;
	}

}
