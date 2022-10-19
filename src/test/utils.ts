import * as nodePath from "path";
import {
	FileSystemGeneratorYield,
	getFileExt,
	getFileNameWithoutExt,
	getPathByFilter,
	toFlatPath,
	trimDir
} from "~/utils";
import {expect} from "chai";
import {CombineFilter} from "~/path-filters";
import {cloneDeep} from "lodash";
import * as fs from "fs-extra";
import * as path from "path";

export const generatePathStub = (path: string) => {
	const parsedPath = nodePath.parse(path);
	return ({
		fullPath: path,
		parsedPath: {
			...parsedPath,
			fullExt: getFileExt(parsedPath.base),
			baseNameWithoutExt: getFileNameWithoutExt(parsedPath.base)
		},
		pathStat: undefined as any,
		level: undefined as any,
	});
}

export const generatePathStubs = (paths: string[]): FileSystemGeneratorYield[] => paths.map(generatePathStub);


export const compareTwoDirs = async (actualPath: string, expectedPath: string) => {

	const actualPaths = toFlatPath(await getPathByFilter(actualPath, new CombineFilter([]))).map(trimDir(actualPath));
	const expectedPathsEx = await getPathByFilter(expectedPath, new CombineFilter([]));

	const actualSet = new Set(actualPaths)
	const checkDeletePath = cloneDeep(actualSet)
	
	for await (const expectedPathEx of expectedPathsEx) {
		const trimmedExpectedPath = trimDir(expectedPath)(expectedPathEx.fullPath)
		expect(actualSet, `Actual should contains path "${trimmedExpectedPath}"`).contains(trimmedExpectedPath)
		checkDeletePath.delete(trimmedExpectedPath)
		
		const fullPathToActual = path.join(actualPath, trimmedExpectedPath)
		
		if(expectedPathEx.pathStat.isFile()){
			const expectedFileContent = await fs.readFile(expectedPathEx.fullPath);
			const actualFileContent = await fs.readFile(fullPathToActual);
			
			expect(
				actualFileContent.toString(), 
				`Files \n\n${expectedPathEx.fullPath}"\n${fullPathToActual}\n\nare not equal`
			).to.be.eql(expectedFileContent.toString())
		}
	}
	
	expect(checkDeletePath, `Should not contain extra paths: ${Array.from(checkDeletePath.keys()).join(", ")}`).to.be.empty
}
