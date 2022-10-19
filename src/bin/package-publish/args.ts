import yargs from 'yargs'
import {hideBin} from "yargs/helpers";

const args = yargs(hideBin(process.argv))
	.option('registry', {
		type: 'string',
		description: 'Npm registry'
	})
	.option('dont-publish', {
		type: 'boolean',
		default: false,
		description: `Don't publish a package`
	})
	.option('dont-build', {
		type: 'boolean',
		default: false,
		description: `Don't build a package`
	})
	.parse();

export default (): Promise<{
	registry?: string,
	dontPublish: boolean,
	dontBuild: boolean
}> => new Promise(r => r(args));

