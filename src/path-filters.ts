import {FileSystemGeneratorYield} from "./utils";

export interface IPathFilter {
	filter(path: FileSystemGeneratorYield): boolean
}

export class IsDirFilter implements IPathFilter{
	filter(path: FileSystemGeneratorYield): boolean {
		return path.pathStat.isDirectory();
	}
}

export class IsFileFilter implements IPathFilter{
	filter(path: FileSystemGeneratorYield): boolean {
		return path.pathStat.isFile();
	}
}

export class ExactLevelFilter implements IPathFilter {

	constructor(private exactLevel: number) {
	}

	filter(path: FileSystemGeneratorYield): boolean {
		return path.level === this.exactLevel;
	}
}

export class CombineFilter implements IPathFilter {

	constructor(private filters: IPathFilter[]) {
	}

	filter(path: FileSystemGeneratorYield): boolean {
		return !this.filters.find(f => !f.filter(path))
	}
}

export class MaxLevelFilter implements IPathFilter {

	constructor(private maxLevel: number) {
	}

	filter(path: FileSystemGeneratorYield): boolean {
		return path.level <= this.maxLevel;
	}
}

export class MinLevelFilter implements IPathFilter {

	constructor(private minLevel: number) {
	}

	filter(path: FileSystemGeneratorYield): boolean {
		return path.level >= this.minLevel;
	}
}

export class HasFileExtFilter implements IPathFilter {
	constructor(private ext: string[]) {
	}

	filter(path: FileSystemGeneratorYield): boolean {
		return this.ext.includes(path.parsedPath.fullExt)
	}
}

export class ByBaseNameFilter implements IPathFilter {

	constructor(private names: string[]) {
	}

	filter(path: FileSystemGeneratorYield): boolean {
		return this.names.includes(path.parsedPath.baseNameWithoutExt)
	}
}
