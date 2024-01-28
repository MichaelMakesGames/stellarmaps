import { getStellarisDataPaths } from './fsUtils';
import fs from 'fs/promises';

const locRegExp = /^\s*([\w.-]+)\s*:\d*\s*"(.*)".*$/gm;
export async function loadLoc(installPath: string) {
	const locFilePaths = await getStellarisDataPaths(installPath, '**/*.yml');
	if (locFilePaths.length === 0) {
		throw new Error('No localisation files found');
	}
	return (
		await Promise.all(
			locFilePaths.map(async (p) => {
				const fileLocs: Record<string, string> = {};
				const f = await fs.open(p);
				let isCorrectLanguageFile = false;
				for await (const line of f.readLines({ encoding: 'utf8' })) {
					if (line.includes('l_english')) {
						isCorrectLanguageFile = true;
					}
					break;
				}
				f.close();
				if (isCorrectLanguageFile) {
					const rawContent = await fs.readFile(p, { encoding: 'utf8' });
					for (const match of rawContent.matchAll(locRegExp)) {
						fileLocs[match[1]] = match[2];
					}
				}
				return fileLocs;
			}),
		)
	).reduce((acc, cur) => Object.assign(acc, cur), {});
}
