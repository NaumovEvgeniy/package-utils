import {compareTwoDirs} from "~/test/utils";
import {WriteIndexPackageJson} from "~/tasks/WriteIndexPackageJson";
import * as path from "path";
import * as fs from "fs-extra"

describe('WriteIndexPackageJson', () => {
	const cases = [
		{
			name: '1',
			distPath: path.join(__dirname, 'fixtures', 'WriteIndexPackageJson', '1', 'initial'),
			expectedPath: path.join(__dirname, 'fixtures', 'WriteIndexPackageJson', '1', 'expected'),
			type: 'main',
			buildType: 'commonjs',
		},
		{
			name: '2',
			distPath: path.join(__dirname, 'fixtures', 'WriteIndexPackageJson', '2', 'initial'),
			expectedPath: path.join(__dirname, 'fixtures', 'WriteIndexPackageJson', '2', 'expected'),
			type: 'module',
			buildType: 'esnext',
		}
	] as const;
	
	const destPath = path.join(__dirname, 'fixtures', 'WriteIndexPackageJson', 'dest');
	
	const cleanDestDir = async () => {
		await fs.rm(destPath, {recursive: true})
		await fs.ensureDir(destPath)
	}
	
	beforeEach(() => cleanDestDir())
	after(() => cleanDestDir())
	
	cases.forEach(p => {
		it(p.name, async () => {
			await fs.copy(p.distPath, destPath, {
				recursive: true
			})
			await WriteIndexPackageJson(destPath, path.join(destPath, p.buildType), p.type)()
			
			await compareTwoDirs(destPath, p.expectedPath)
			
		})
	})
})
