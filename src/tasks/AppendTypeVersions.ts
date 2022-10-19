import * as fs from "fs-extra";
import {PackageJson} from "type-fest";
import {dirname} from "path";

export const AppendTypeVersions = () => {
	return async (p: {pathToPackageJson: string, pathToTypes: string, typescriptVersion?: string}) => {
		const packageJson: PackageJson = await fs.readJson(p.pathToPackageJson)

		const packageJsonDir = dirname(p.pathToPackageJson)
		const resultPath = p.pathToTypes.substr(packageJsonDir.length + 1)

		packageJson.typesVersions = {
			[p.typescriptVersion ?? '*']: {
				"*": [`${resultPath}/*`]
			}
		};

		packageJson.types = `./index.d.ts`

		await fs.writeJson(p.pathToPackageJson, packageJson, {spaces: 4})
	}
}
