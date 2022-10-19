import {createStubInstance, SinonStub, stub} from "sinon";
import * as childProcess from "node:child_process";
import {expect} from "chai";
import {CmdBuilder} from "./CmdBuilder";
import {Readable} from "stream";

describe('CmdBuilder', () => {



	describe('execCmd', () => {


		let process: any;
		let spawnStub: SinonStub;

		let errorCallback: (data: any) => void
		let stdoutCallback: (data: string) => void
		let stderrCallback: (data: string) => void
		let closeCallback: (code: number) => void

		let nextStub: SinonStub<[{stdout?: string, stderr?: string}]>
		let errorStub: SinonStub
		let completeStub: SinonStub

		beforeEach(() => {
			process = {
				...createStubInstance(childProcess.ChildProcess),
				stderr: createStubInstance(Readable),
				stdout: createStubInstance(Readable)
			};
			spawnStub = stub(childProcess, 'spawn').returns(process)

			nextStub = stub<[{stdout?: string, stderr?: string}]>();
			errorStub = stub();
			completeStub = stub();

			process.on.callsFake((event: string, callback: (data?: any) => void) => {
				if (event === 'error') {
					errorCallback = callback;
				}
				if(event === 'close'){
					closeCallback = callback;
				}
				return process;
			})

			process.stdout.on.callsFake((event: string, callback: (data: string) => void) => {
				if(event === 'data'){
					stdoutCallback = callback
				}
				return process;
			})
			process.stderr.on.callsFake((event: string, callback: (data: string) => void) => {
				if(event === 'data'){
					stderrCallback = callback
				}
				return process;
			})
		});

		afterEach(() => {
			spawnStub.restore();
		})

		describe('check streams', () => {
			const cases: {name: string, error?: Error | null, stderr?: string, stdout?: string}[] = [
				{name: 'error', error: new Error('some error')},
				{name: 'stdout', stdout: 'stdout value'},
				{name: 'stderr', stderr: 'stderr value'},
				{name: 'stderr and stdout', stderr: 'stderr value', stdout: 'stdout value'},
			];

			cases.forEach(p => {
				it(p.name, () => {
					const cmd = `cmd-${Math.random()}`

					new CmdBuilder(cmd).exec().subscribe({
						error: errorStub,
						next: nextStub,
						complete: completeStub
					})

					if(p.error){
						errorCallback!(p.error)
					}
					if(p.stdout){
						stdoutCallback!(p.stdout)
					}
					if(p.stderr){
						stderrCallback!(p.stderr)
					}

					closeCallback!(0);

					if(p.error){
						expect(errorStub.calledOnce, "Should error call").to.be.true
						expect(errorStub.args[0][0], "Should error equal").to.be.eql(p.error)
					}else{
						expect(errorStub.called, "Error should not be called").to.be.false
						expect(completeStub.calledOnce, 'Should be completed').to.be.true
					}

					if(p.stdout){
						expect(nextStub.calledWith({stdout: p.stdout}), 'Should be same stdout value').to.be.true
					}

					if(p.stderr){
						expect(nextStub.calledWith({stderr: p.stderr}), 'Should be same stderr value').to.be.true
					}

				})
			})
		})

		describe('Should raise error if program exit code was non 0', () => {
			const cases = [
				{code: 0, shouldError: false},
				{code: 1, shouldError: true},
			];

			cases.forEach(p => {
				it(`Code: ${p.code}`, () => {
					new CmdBuilder('cmd').exec().subscribe({
						error: errorStub,
						next: nextStub,
						complete: completeStub
					})

					closeCallback(p.code)
					if(p.shouldError){
						expect(completeStub.called, 'Should not be completed').to.be.false
						expect(errorStub.calledOnce, 'Should be error').to.be.true
						expect(errorStub.args[0][0], 'Should be error').to.be.eql({
							exit: true,
							code: p.code
						})
					}else{
						expect(errorStub.called, 'Should not be error raised').to.be.false
						expect(completeStub.calledOnce, 'Should be completed').to.be.true
					}
				})
			});
		})
	})
})
