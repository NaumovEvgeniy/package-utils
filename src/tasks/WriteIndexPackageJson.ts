import {getPathByFilter, trimDir} from "~/utils";
import {ByBaseNameFilter, CombineFilter, HasFileExtFilter, IsFileFilter, MinLevelFilter} from "~/path-filters";
import * as fs from "fs-extra";
import * as path from "path";
import {trim} from "lodash";
import {PackageJson} from "type-fest";

export const WriteIndexPackageJson = (distPath: string, buildPath: string, type: 'main' | 'module' | 'types') => async () => {
	const indexFiles = await getPathByFilter(buildPath, new CombineFilter([
		new IsFileFilter(), new ByBaseNameFilter(['index']), new MinLevelFilter(2), new HasFileExtFilter(['js', 'mjs', 'cjs', 'd.ts'])
	]))

	const buildRelativePath = trim(trimDir(distPath)(buildPath), '/');
	
	for await (const file of indexFiles){
		const pathRelativeBuild = trimDir(buildPath)(file.parsedPath.dir)
		
		const indexDirPath = path.join(distPath, pathRelativeBuild);
		await fs.ensureDir(indexDirPath)
		const indexDirPackageJson = path.join(indexDirPath, 'package.json');
		
		
		
		const packageJsonContent: PackageJson = await fs.readJson(indexDirPackageJson).catch(() => ({}))
		
		let pathToIndexFile = [
			Array(file.level - 1).fill('..').join('/'),
			buildRelativePath,
			trim(pathRelativeBuild, '/'),
			''
		].join('/');
		
		
		packageJsonContent[type] = pathToIndexFile + file.parsedPath.base;
		
		await fs.writeJson(indexDirPackageJson, packageJsonContent, {
			spaces: 4
		})
	}
}
