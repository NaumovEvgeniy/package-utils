import * as fs from "fs-extra";

export const CreateJsonFileTask = () => {
	return new class {
		getTask(){
			return async (p: {file: string, object: object})  => {
				await fs.writeJson(p.file, p.object)
			}
		}
	}
}
