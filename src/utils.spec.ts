import {FileSystemGeneratorYield, getFileExt, getFileNameWithoutExt, readDir, trimDir} from "./utils";
import {expect} from "chai";
import {createStubInstance, SinonStubbedInstance, stub} from "sinon";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import {Stats} from "fs";

describe('utils', () => {

	describe('getFileExt & getFileNameWithoutExt', () => {
		const cases = [
			{name: '.js', path: 'c.js', expect: 'js', baseName: 'c'},
			{name: 'empty', path: 'c', expect: '', baseName: 'c'},
			{name: 'd.ts', path: 'ca.d.ts', expect: 'd.ts', baseName: 'ca'},
		];

		describe('getFileExt', () => {

		})
		cases.forEach(p => {
			it(p.name, () => {
				expect(getFileExt(p.path)).to.be.eq(p.expect)
				expect(getFileNameWithoutExt(p.path)).to.be.eq(p.baseName)
			})
		})
	})

	describe('readDir', () => {
		const cases = [
			{
				name: '1',
				files: {
					'/cjs': ['W3D', 'classes', 'index.js', 'index.js.map'],
					'/cjs/W3D': [
						'CreateCanvas.js',
						'TV3.js.map'
					],
					'/cjs/classes': [
						'LoaderExtensions',
					],
					'/cjs/classes/LoaderExtensions': [
						'AddonProcessor',
						'ClickONLoaderExtension.js',
						'ClickONLoaderExtension.js.map'
					],
					'/cjs/classes/LoaderExtensions/AddonProcessor': [
						'AddonProcessor.js',
						'AddonProcessor.js.map',
						'ExecutionMapHandlers',
					],
					'/cjs/classes/LoaderExtensions/AddonProcessor/ExecutionMapHandlers': [
						'hello.js'
					]
				},
				expected: [
					'/cjs',
					'/cjs/W3D',
					'/cjs/W3D/CreateCanvas.js',
					'/cjs/W3D/TV3.js.map',
					'/cjs/classes',
					'/cjs/classes/LoaderExtensions',
					'/cjs/classes/LoaderExtensions/AddonProcessor',
					'/cjs/classes/LoaderExtensions/AddonProcessor/AddonProcessor.js',
					'/cjs/classes/LoaderExtensions/AddonProcessor/AddonProcessor.js.map',
					'/cjs/classes/LoaderExtensions/AddonProcessor/ExecutionMapHandlers',
					'/cjs/classes/LoaderExtensions/AddonProcessor/ExecutionMapHandlers/hello.js',
					'/cjs/classes/LoaderExtensions/ClickONLoaderExtension.js',
					'/cjs/classes/LoaderExtensions/ClickONLoaderExtension.js.map',
					'/cjs/index.js',
					'/cjs/index.js.map',
				],
			}
		];

		cases.forEach(p => {
			it(p.name, async () => {

				const fsStub = stub(fs)
				fsStub.readdir.callsFake(async (calledPath) => {
					return (p.files[calledPath as keyof typeof p.files] as any) ?? [];
				});

				const stats: {[s: string]: SinonStubbedInstance<Stats>} = {};
				const getLstat = (path: string) => {
					if(path in stats){
						return stats[path];
					}
					const stat = createStubInstance(Stats)
					const isFile = path.indexOf('.') > -1;
					stat.isDirectory.returns(!isFile)
					stat.isFile.returns(isFile)
					stats[path] = stat;

					return stat;
				}
				// @ts-ignore
				fsStub.lstat.callsFake(async (path: string) => getLstat(path));

				const expectedResult: FileSystemGeneratorYield[] = p.expected.map(p => {
					const parsedPath = path.parse(p)
					return ({
						fullPath: p,
						pathStat: getLstat(p),
						level: p.replace(/[^\/]/g, '').length,
						parsedPath: {
							...parsedPath,
							baseNameWithoutExt: getFileNameWithoutExt(parsedPath.base),
							fullExt: getFileExt(parsedPath.base)
						}
					});
				})

				const result: FileSystemGeneratorYield[] = [];
				for await (const p of await readDir('/cjs')){
					result.push(p)
				}

				expect(expectedResult).to.be.eql(result)
			})
		})
	})
	
	it('trimDir', () => {
		const dir = '/a/b/c/d';
		const base = '/a/b'
		const expected = '/c/d'
		expect(trimDir(base)(dir)).to.be.eql(expected)
	})
})
