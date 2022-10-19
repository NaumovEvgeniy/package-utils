import * as fs from "fs/promises";
import {SinonStub, stub} from "sinon";
import {DeleteFolderTask} from "./DeleteFolderTask";
import {expect} from "chai";

describe('DeleteFolderTask', () => {

	let rmStub: SinonStub<Parameters<typeof fs.rm>>
	beforeEach(() => {
		rmStub = stub(fs, 'rm')
	})

	afterEach(() => {
		rmStub.restore();
	})

	describe('Should delete dir recursively', () => {
		const cases = [
			{name: 'Dir does not exists', exists: false, shouldException: true},
			{name: 'Dir exists', exists: true, shouldException: false},
			{name: 'Skip skip check', exists: false, shouldException: false, options: {skipCheck: true}},
			{name: 'Dont skip check', exists: false, shouldException: true, options: {skipCheck: false}},
		];
		cases.forEach(p => {

			it(p.name, async () => {

				if(!p.exists){
					rmStub.throwsException(new Error())
				}

				const path = `/a/b/${Math.random()}`;
				try {
					expect(await DeleteFolderTask(path, p.options)()).to.be.eql(p.exists)
					expect(false).to.be.eq(p.shouldException)
				} catch (e) {
					expect(true).to.be.eq(p.shouldException)
				}

				expect(rmStub.calledOnce, 'Should called rm').to.be.true
				expect(rmStub.args[0], 'Args should be equaled').to.be.eql([path, {
					recursive: true
				}])
			})
		})
	});

})
