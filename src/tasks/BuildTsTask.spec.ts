import {BuildTsTask} from "~/tasks/BuildTsTask";
import {expect} from "chai";
import {SinonStub, stub} from "sinon";
import {CmdBuilder} from "~/tasks/CmdBuilder";
import {Subject} from "rxjs";

describe('BuildTsTask', () => {

	const dir = `/a/b/${Math.random()}`

	describe('exec task', () => {

		let processCwdStub: SinonStub<[]>

		let setArgsStub: SinonStub<Parameters<typeof CmdBuilder.prototype.setArgs>>
		let withDebugStub: SinonStub<Parameters<typeof CmdBuilder.prototype.withDebug>>
		let execStub: SinonStub<Parameters<typeof CmdBuilder.prototype.exec>>

		let exec$: Subject<{ stdout?: string, stderr?: string }>

		beforeEach(() => {

			processCwdStub = stub(process, 'cwd');
			processCwdStub.returns(dir)

			setArgsStub = stub(CmdBuilder.prototype, 'setArgs')
			setArgsStub.returnsThis();

			withDebugStub = stub(CmdBuilder.prototype, 'withDebug')
			withDebugStub.returnsThis();

			exec$ = new Subject();

			execStub = stub(CmdBuilder.prototype, 'exec')
			execStub.returns(exec$)
		})

		afterEach(() => {
			processCwdStub.restore();
			setArgsStub.restore();
			withDebugStub.restore();
			execStub.restore();
		})

		const cases = [
			{
				name: 'without options',
				moduleType: 'esnext',
				expectCliArgs: ['--module', 'esnext', '--declaration', 'false', '--outDir', `${dir}/dist/__esnext`],
				expectedResult: {outDir: `${dir}/dist/__esnext`}
			},
			{
				name: 'with dir options',
				moduleType: 'esnext',
				dir: '/custom/',
				expectCliArgs: ['--module', 'esnext', '--declaration', 'false', '--outDir', `/custom/__esnext`],
				expectedResult: {outDir: `/custom/__esnext`}
			},
			{
				name: 'build cjs',
				moduleType: 'commonjs',
				dir: '/custom/nested',
				expectCliArgs: ['--module', 'commonjs', '--declaration', 'false', '--outDir', `/custom/nested/__commonjs`],
				expectedResult: {outDir: `/custom/nested/__commonjs`}
			},
			{
				name: 'build cjs',
				moduleType: 'commonjs',
				dir: '/custom/',
				types: true,
				expectCliArgs: ['-p', 'tsconfig.aaa.bbb.json', '--module', 'commonjs',`--emitDeclarationOnly`, '--declaration', '--declarationMap', '--outDir', `/custom/__types`],
				expectedResult: {outDir: `/custom/__types`},
				project: 'tsconfig.aaa.bbb.json'
			},
		];

		cases.forEach(p => {

			it(p.name, async () => {
				const taskBuilder = BuildTsTask(p.moduleType);
				if(p.dir){
					taskBuilder.setDistFolder(p.dir);
				}
				if(p.types){
					taskBuilder.buildTypes();
				}

				if(p.project){
					taskBuilder.useTsConfig(p.project)
				}

				const task = taskBuilder.getTask();

				Promise.resolve().then(() => {
					exec$.complete();
				})

				expect(await task()).to.be.eql(p.expectedResult)

				expect(setArgsStub.calledOnce).to.be.true
				expect(setArgsStub.args[0][0]).to.be.deep.equal(p.expectCliArgs)
			})
		})
	})
})
