import * as path from "node:path";
import {CmdBuilder} from "./CmdBuilder";

type AllowedType = 'none' | 'commonjs' | 'amd' | 'umd' | 'system' | 'es6' | 'es2015' | 'es2020' | 'es2022' | 'esnext' | 'node16' | 'nodenext';

type BuildResult = {
	outDir: string
}

export const BuildTsTask = (moduleType: AllowedType | string) => {

	let distFolder: string | undefined
	let buildTypes = false;
	let tsConfig: string | undefined;

	const getDefaultOutDir = (dirName?: string) => {
		return path.join(process.cwd(), 'dist', dirName ?? moduleType);
	}

	return new class {

		setDistFolder(newDistFolder?: string): this {
			distFolder = newDistFolder;
			return this;
		}

		buildTypes(): this {
			buildTypes = true;
			return this;
		}
		
		useTsConfig(pathToTsConfig?: string): this {
			tsConfig = pathToTsConfig;
			return this;
		}

		getTask() {
			return () => {
				return new Promise<BuildResult>((resolve, error) => {


					const args: string[] = [];
					if(tsConfig){
						args.push(`-p`, tsConfig)
					}
					args.push(`--module`, `${moduleType}`)
					let outDir: string
					if(buildTypes){
						outDir = distFolder
							? path.join(distFolder, '__types')
							: getDefaultOutDir('__types');
						args.push(`--emitDeclarationOnly`, `--declaration`, '--declarationMap')
					}else{
						outDir = distFolder
							? path.join(distFolder, '__' + moduleType)
							: getDefaultOutDir('__' + moduleType);

						args.push(`--declaration`, 'false')
					}
					args.push(`--outDir`, `${outDir}`)

					new CmdBuilder('./node_modules/.bin/tsc')
						.setArgs(args)
						.withDebug()
						.exec()
						.subscribe({
							next: e => {
								if (e.stderr) {
									throw e;
								}
								if (e.stderr) {
									console.log('[X] STDERR')
									console.log(e.stderr)
								}
								if (e.stdout) {
									console.log('[V] STDOUT')
									console.log(e.stdout)
								}
							},
							error,
							complete: () => resolve({outDir})
						});
				})
			}
		}

	}


}
