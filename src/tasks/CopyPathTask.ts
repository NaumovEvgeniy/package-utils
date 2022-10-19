import * as fs from "fs-extra";


export const CopyPathTask = (from: string, to: string) => async () => {
	await fs.copy(from, to)
}
