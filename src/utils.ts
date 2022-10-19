import * as fs from "node:fs/promises";
import * as path from "node:path";
import type {Stats} from "fs";
import {IPathFilter, IsDirFilter, IsFileFilter} from "./path-filters";
import {ParsedPath} from "path";

export type ExParsedPath = ParsedPath & {
	fullExt: string,
	baseNameWithoutExt: string,
}

export type FileSystemGeneratorYield = {
	fullPath: string
	parsedPath: ExParsedPath
	level: number
	pathStat: Stats
}

export const getFileExt = (name: string): string => {
	const firstDot = name.indexOf('.')
	if(firstDot === -1){
		return '';
	}

	return name.substr(firstDot + 1);
}


export const getFileNameWithoutExt = (name: string): string => {
	const firstDot = name.indexOf('.')
	if(firstDot === -1){
		return name;
	}

	return name.substr(0, firstDot);
}


export async function* readDir(basePath: string): AsyncGenerator<FileSystemGeneratorYield> {

	async function generateData(fullPath: string, level: number): Promise<FileSystemGeneratorYield> {
		const parsedPath = path.parse(fullPath);
		return {
			fullPath,
			pathStat: await fs.lstat(fullPath),
			parsedPath: {
				...parsedPath,
				fullExt: getFileExt(parsedPath.base),
				baseNameWithoutExt: getFileNameWithoutExt(parsedPath.base),
			},
			level: level
		}
	}

	async function* func(level: number, basePath: string): AsyncGenerator<FileSystemGeneratorYield> {
		const folderContent = await fs.readdir(basePath)
		for await (const name of folderContent){
			const fullPath = path.join(basePath, name);
			const yieldData = await generateData(fullPath, level)

			if(yieldData.pathStat.isDirectory()){
				yield yieldData
				for await (const p of await func(level + 1, fullPath)){
					yield p;
				}
			}else{
				yield yieldData
			}
		}
	}

	yield await generateData(basePath, 1)
	for await (const p of await func(1, basePath)){
		yield p;
	}
}

const eachPath = async (basePath: string, filterFunc: (data: FileSystemGeneratorYield) => boolean) => {
	const result: FileSystemGeneratorYield[] = [];
	for await (const data of await readDir(basePath)){
		if(filterFunc(data)){
			result.push(data)
		}
	}
	return result;
}

export const getAllFiles = async (basePath: string): Promise<FileSystemGeneratorYield[]> => {
	return getPathByFilter(basePath, new IsFileFilter())
}

export const getAllFilePaths = async (basePath: string): Promise<string[]> => {
	return toFlatPath(await getPathByFilter(basePath, new IsFileFilter()))
}

export const getAllFolders = async (basePath: string): Promise<FileSystemGeneratorYield[]> => {
	return getPathByFilter(basePath, new IsDirFilter())
}

export const getPathByFilter = async (basePath: string, filter: IPathFilter): Promise<FileSystemGeneratorYield[]> => {
	return eachPath(basePath, (p) => filter.filter(p));
};

export const toFlatPath = (data: FileSystemGeneratorYield[]) => data.map(d => d.fullPath);

export const interrupt = (message?: string, isError = false) => {
	if(message) {
		isError
			? console.error(message)
			: console.log(message);
	}

	process.exit(isError ? 1 : 0);
}

export const trimDir = (base: string) => (dir: string) => {
	return dir.slice(base.length)
}
