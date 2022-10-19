import {ByBaseNameFilter, HasFileExtFilter, IPathFilter} from "./path-filters";
import {expect} from "chai";
import {generatePathStub, generatePathStubs} from "~/test/utils";


const checkFilter = (filter: IPathFilter, paths: string[]): string[] => {
	const result: string[] = [];
	for(const path of generatePathStubs(paths)){
		if(filter.filter(path)){
			result.push(path.fullPath)
		}
	}
	return result;
}

describe('path-filter', () => {
	describe('HasFileExtFilter', () => {
		const cases = [
			{
				name: '1',
				ext: ['js', 'd.ts'],
				files: ['/a/b/c1.js', '/a/b/c2.ts', '/a/b/c3.d.ts', '/a/b/c'],
				expected: ['/a/b/c1.js', '/a/b/c3.d.ts'],
			}
		];

		cases.forEach(p => {
			it(p.name, () => {
				const filter = new HasFileExtFilter(p.ext)
				expect(checkFilter(filter, p.files)).to.be.eql(p.expected)
			})
		})
	})


	describe('ByBaseNameFilter', () => {
		const cases = [
			{name: 'empty files', files: [], path: generatePathStub('/a/b/c.d.ts'), result: false},
			{name: 'without exact', files: ['a', 'd'], path: generatePathStub('/a/b/c.d.ts'), result: false},
			{name: 'with exact', files: ['a', 'c'], path: generatePathStub('/a/b/c.d.ts'), result: true},
			{name: 'only exact', files: ['c'], path: generatePathStub('/a/b/c.d.ts'), result: true},
		];

		cases.forEach(p => {
			it(p.name, () => {
				expect(new ByBaseNameFilter(p.files).filter(p.path)).to.be.eql(p.result)
			})
		})
	})
})
