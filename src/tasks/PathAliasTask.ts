import {replaceTscAliasPaths} from 'tsc-alias';


export const PathAliasTask = () => {
	let tsConfig: string | undefined
	return new class {
		useConfig(config?: string): this {
			tsConfig = config;
			return this;
		}
		getTask() {
			return async (p: {buildPath: string}) => {
				await replaceTscAliasPaths({
					configFile: tsConfig,
					outDir: p.buildPath,
					verbose: true
				})
			}
		}
	}
}
