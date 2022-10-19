import {getAllFolders, getPathByFilter} from "~/utils";
import {PackageJson} from "type-fest";
import {dirname} from "path";
import * as fs from "fs-extra";
import * as _ from "lodash";
import {ByBaseNameFilter, CombineFilter, ExactLevelFilter, IsFileFilter} from "~/path-filters";
import ExportCondition = PackageJson.ExportCondition;

export const AppendExportsToPackageJson = () => {

	return new class {
		getTask() {
			return async (p: {type: ExportCondition, pathToPackageJson: string, moduleBuildFolder: string, ext: string}) => {

				const packageJsonDir = dirname(p.pathToPackageJson)
				const folders = await getAllFolders(p.moduleBuildFolder);
				const packageJson: PackageJson = await fs.readJson(p.pathToPackageJson);
				if(!packageJson.exports || typeof packageJson.exports !== 'object' || Array.isArray(packageJson.exports)){
					packageJson.exports = {};
				}
				let exports: {[key in string]: any} = packageJson.exports;

				const appendExport = (module: string, path: string) => {
					if(!(module in exports)){
						exports[module] = {}
					}
					exports[module][p.type] = `./${path}`;
				}

				for await (const folderData of folders){

					const pathToModuleRelativePackageJson = folderData.fullPath.substr(packageJsonDir.length + 1);
					const pathToModuleRelativeBuild = folderData.fullPath.substr(p.moduleBuildFolder.length + 1);
					let data = _.trimEnd(`./${pathToModuleRelativeBuild}`, '/');

					const indexFiles = await getPathByFilter(folderData.fullPath, new CombineFilter([
						new IsFileFilter(), new ExactLevelFilter(1), new ByBaseNameFilter(['index'])
					]));

					if(indexFiles.length) {
						appendExport(data, `${pathToModuleRelativePackageJson}/index.${p.ext}`)
					}

					data += `/*`;

					appendExport(data, `${pathToModuleRelativePackageJson}/*.${p.ext}`)
				}

				await fs.writeJson(p.pathToPackageJson, packageJson, {
					spaces: 4
				})

				// const filePaths = await getAllFolders(sourceFolder);
				// const exports: Exports = {};
				// for(const pathToFolder of filePaths){
				// 	const relativePath = pathToFolder.fullPath.substr(sourceFolder.length + 1);
				// 	if(relativePath){
				// 		const typesPattern = `./build/types/${relativePath}/*.d.ts`;
				// 		const cjsPattern = `./build/cjs/${relativePath}/*.js`;
				// 		const esmPattern = `./build/esm/${relativePath}/*.mjs`;
				//
				// 		exports[`./${relativePath}/*`] = {
				// 			types: typesPattern,
				// 			require: cjsPattern,
				// 			import: esmPattern,
				// 			default: esmPattern,
				// 		}
				// 	}
				// }
			};
		}
	}
}
