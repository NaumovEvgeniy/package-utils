import * as fs from "fs-extra";

type Options = {
	createIfNotExist?: boolean
};

export const CheckPathTask = (path: string, options?: Options) => async () => {
	if(!await fs.pathExists(path)){

		if(options?.createIfNotExist){
			await fs.ensureDir(path)
			return true;
		}
		throw `Path "${path}" does not exist`;
	}
	return true;
}
