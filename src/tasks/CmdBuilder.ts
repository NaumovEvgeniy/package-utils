import {Observable} from "rxjs";
import * as childProcess from "node:child_process";

export class CmdBuilder {
	private args?: string[]
	private printDebug = false;
	constructor(private cmd: string) {
	}

	setArgs(pArgs: string[]): this {
		this.args = pArgs;
		return this;
	}

	withDebug(): this {
		this.printDebug = true;
		return this;
	}

	exec(){
		return new Observable<{stderr?: string, stdout?: string}>(subscriber => {
			if(this.printDebug){
				console.log(this.cmd, this.args)
			}

			const cmdResult = childProcess.spawn(this.cmd, this.args)

			cmdResult.stderr.on('data', (data: string | Buffer) => {
				subscriber.next({stderr: data.toString()});
			});

			cmdResult.stdout.on('data', (data: string | Buffer) => {
				subscriber.next({stdout: data.toString()});
			});

			cmdResult.on('error', (data) => {
				subscriber.error(data)
			})

			cmdResult.on('close', (code) => {
				if(code === 0) {
					subscriber.complete();
				}else{
					subscriber.error({
						exit: true,
						code
					})
				}
			})
		});
	}
}
