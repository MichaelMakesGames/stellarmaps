import fs from 'fs/promises';

import { getStellarisDataPaths } from './fsUtils';

export async function loadColors(installPath: string) {
	const filePaths = await getStellarisDataPaths(installPath, 'flags/colors.txt');
	if (filePaths.length === 0) {
		throw new Error('No color files found');
	}
	return Promise.all(filePaths.map((p) => fs.readFile(p, { encoding: 'utf8' })));
}
