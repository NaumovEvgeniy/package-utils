#!/usr/bin/env node
import * as path from "path"
import * as childProcess from "child_process"
import * as util from "util";
import parseArguments from './args';
import {CheckPathTask} from "~/tasks/CheckPathTask";
import {DeleteFolderTask} from "~/tasks/DeleteFolderTask";
import {Task} from "~/tasks/Task";
import {CopyPathTask} from "~/tasks/CopyPathTask";


const packageDir = process.cwd();
const pathToDist = path.join(packageDir, 'dist');

(async () => {
	
	const args = await parseArguments();
	
	await Task("Check project root", CheckPathTask(path.join(packageDir, 'package.json')))()
		.catch(() => {
			throw new Error('Unable to read "package.json" file. Make sure you launch script from the package root folder')
		})
	
	
	if(!args.dontBuild) {
		await Task('Delete dist', DeleteFolderTask(pathToDist, {skipCheck: true}));
		const buildResult = await Task('Try build', util.promisify(childProcess.exec))(`npm run build`);
		if(buildResult.stderr){
			console.error(buildResult)
			throw new Error('Build failure');
		}

		try {
			await Task("Check dist package json", CheckPathTask(path.join(pathToDist, 'package.json')))()
		} catch (e) {
			await Task('Copy package json', CopyPathTask(path.join(packageDir, 'package.json'), path.join(pathToDist, 'package.json')))()
		}
	}
	
	if(!args.dontPublish) {
		let publishCommand = ['npm', 'publish'];
		if(args.registry){
			publishCommand.push(`--registry=${args.registry}`)
		}
		
		const publishCommandStr = publishCommand.join(' ')
		
		await Task('Publish', async () => {
			const result = await util.promisify(childProcess.exec)(`cd ${pathToDist} && ${publishCommandStr}`);
			console.log('>> Publish result')
			console.log(result.stdout)
		})();
	}
})().then(() => console.log('Complete')).catch(e => console.error('Error', e));
