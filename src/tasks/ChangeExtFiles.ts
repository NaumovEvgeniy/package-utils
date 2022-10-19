import {getAllFiles} from "~/utils";
import * as path from "node:path";
import * as fs from "fs-extra";

type ExtMap = {
	[ext: string]: string
}

export const ChangeExtFiles = () => {

	return new class {
		getTask() {
			return async (p: {dir: string, extMap: ExtMap}) => {
				const files = await getAllFiles(p.dir)
				for await (const file of files){

					if(file.parsedPath.fullExt in p.extMap){
						const newPath = `${file.parsedPath.dir}${path.sep}${file.parsedPath.baseNameWithoutExt}.${p.extMap[file.parsedPath.fullExt]}`;
						await fs.rename(
							file.fullPath,
							newPath
						);
					}
				}
			};
		}
	}
}
