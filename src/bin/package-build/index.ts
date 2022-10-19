#!/usr/bin/env node

import yargs from "yargs";
import {hideBin} from "yargs/helpers";
import * as path from "node:path";
import {CopyPathTask} from "~/tasks/CopyPathTask";
import {CheckPathTask} from "~/tasks/CheckPathTask";
import {Task} from "~/tasks/Task";
import {CreateFolderTask} from "~/tasks/CreateFolderTask";
import {PathAliasTask} from "~/tasks/PathAliasTask";
import {AppendExportsToPackageJson} from "~/tasks/AppendExportsToPackageJson";
import {CreateJsonFileTask} from "~/tasks/CreateJsonFileTask";
import {AppendTypeVersions} from "~/tasks/AppendTypeVersions";
import {BuildTsTask} from "~/tasks/BuildTsTask";
import {DeleteFolderTask} from "~/tasks/DeleteFolderTask";
import {WriteIndexPackageJson} from "~/tasks/WriteIndexPackageJson";

const getArgs = () => {
	return yargs(hideBin(process.argv))
		.option('dist-folder', {
			type: 'string',
			default: 'dist',
			description: 'Dist folder relative project root folder',
		})
		.option('source-folder', {
			type: 'string',
			default: 'src',
			description: 'Source folder relative project root folder',
		})
		.option('project', {
			type: 'string',
			description: 'path to tsconfig',
		})
		.parse();
}
	
const makePathToPackageJson = (dir: string) => path.join(dir, 'package.json');
const makeReplaceAlias = (distPath: string, moduleBuildFolder: string, type: string, ext: string) => ({
	pathToPackageJson: makePathToPackageJson(distPath),
	moduleBuildFolder,
	type,
	ext
});
	

;(async () => {
	const args = await getArgs();
	const rootPath = process.cwd();
	const srcPath = path.join(rootPath, args.sourceFolder)
	const distPath = path.join(rootPath, args.distFolder)
	
	// === Prepare
	await Task('Check source folder', CheckPathTask(srcPath))();
	await Task('Delete dist folder', DeleteFolderTask(distPath, {skipCheck: true}))();
	await Task('Create dist', CreateFolderTask(distPath))()
	await Task('Copy package.json to the dist folder', CopyPathTask(
		makePathToPackageJson(rootPath),
		makePathToPackageJson(distPath),
	))();

	// ================== Build types
	const typesBuildResult = await Task('Build Types', BuildTsTask('esnext')
		.buildTypes()
		.useTsConfig(args.project)
		.setDistFolder(distPath)
		.getTask())();

	await Task("Replace alias for types", PathAliasTask()
		.useConfig(args.project)
		.getTask()
	)({
		buildPath: typesBuildResult.outDir,
	})
	await Task("Append type versions", AppendTypeVersions())({
		typescriptVersion: ">=4.2",
		pathToTypes: typesBuildResult.outDir,
		pathToPackageJson: makePathToPackageJson(distPath),
	});

	await Task(
		'Types exports',
		AppendExportsToPackageJson().getTask()
	)(makeReplaceAlias(distPath, typesBuildResult.outDir, 'types', 'd.ts'))
	
	await Task('Write types package index', WriteIndexPackageJson(distPath, typesBuildResult.outDir, 'types'))();

	// ==================== Build CJS
	const cjsBuildResult = await Task('Build CJS', BuildTsTask('commonjs')
		.useTsConfig(args.project)
		.setDistFolder(distPath)
		.getTask()
	)();
	await Task('Create CJS package.json', CreateJsonFileTask().getTask())({
		file: makePathToPackageJson(cjsBuildResult.outDir),
		object: {type: "commonjs"}
	});
	await Task('Replace alias for CJS', PathAliasTask()
		.useConfig(args.project)
		.getTask()
	)({
		buildPath: cjsBuildResult.outDir,
	})

	await Task(
		'CJS exports',
		AppendExportsToPackageJson().getTask()
	)(makeReplaceAlias(distPath, cjsBuildResult.outDir, 'require', 'js'));
	
	await Task('Write CJS package index', WriteIndexPackageJson(distPath, cjsBuildResult.outDir, 'main'))();

	// ============== BUILD ESM
	const buildEsmResult = await Task('Build ESM', BuildTsTask('esnext')
		.useTsConfig(args.project)
		.setDistFolder(distPath)
		.getTask()
	)();
	await Task('Create ESM package.json', CreateJsonFileTask().getTask())({
		file: makePathToPackageJson(buildEsmResult.outDir),
		object: {type: "module"}
	});

	await Task('Replace alias for ESM', PathAliasTask()
		.useConfig(args.project)
		.getTask()
	)({
		buildPath: buildEsmResult.outDir,
	})

	const esmExportAlias = makeReplaceAlias(distPath, buildEsmResult.outDir, 'import', 'js');
	await Task('ESM exports', AppendExportsToPackageJson().getTask())(esmExportAlias)
	await Task('Default exports', AppendExportsToPackageJson().getTask())({
		...esmExportAlias,
		type: 'default'
	})
	
	await Task('Write ESM package index', WriteIndexPackageJson(distPath, buildEsmResult.outDir, 'module'))();
})().then(() => console.log('Complete')).catch(e => console.error('Error', e));

