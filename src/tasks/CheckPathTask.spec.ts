import {CheckPathTask} from "./CheckPathTask";
import {expect} from "chai";
import * as fs from "fs-extra";
import {SinonStub, stub} from "sinon";



describe('CheckPathTask', () => {

	let pathExistsStub: SinonStub<Parameters<typeof fs.pathExists>>
	let ensureDirStub: SinonStub<Parameters<typeof fs.ensureDir>>

	beforeEach(() => {
		pathExistsStub = stub(fs, 'pathExists');
		ensureDirStub = stub(fs, 'ensureDir')
	})
	afterEach(() => {
		pathExistsStub.restore();
		ensureDirStub.restore();
	})

	describe('Should delete', () => {

		const cases = [
			{name: 'Path exists', exists: true},
			{name: 'Path does not exist', exists: false},
		];

		cases.forEach(p => {
			it(p.name, async () => {
				const path = `/a/b/${Math.random()}`
				// @ts-ignore
				pathExistsStub.withArgs(path).resolves(p.exists)

				try {
					expect(await CheckPathTask(path)()).to.be.true
				} catch (e) {
					expect(false).to.be.eq(p.exists)
				}
			})
		})
	});

	describe('Create dir if it not exist', () => {
		const cases = [
			{name: 'Dir not exists', dirExists: false},
		];

		cases.forEach(p => {
			it(p.name, async () => {
				pathExistsStub.resolves(false)
				const path = `/path/${Math.random()}`

				expect(await CheckPathTask(path, {
					createIfNotExist: true
				})()).to.be.true

				expect(ensureDirStub.calledOnce, 'Should be called').to.be.true
				expect(ensureDirStub.args[0], 'Should be called').to.be.eql([path])
			})
		})
	})

});
