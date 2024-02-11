import fg from 'fast-glob';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { platformPaths } from 'platform-paths';
import { getSteamPath } from 'steam-path';

export async function getSubDirs(dir: string) {
	const subPaths = (await fs.readdir(dir)).map((subP) => path.join(dir, subP));
	const subPathsData = await Promise.all(
		subPaths.map((subPath) =>
			fs.lstat(subPath).then((stats) => ({ path: subPath, isDir: stats.isDirectory() })),
		),
	);
	return subPathsData.filter((p) => p.isDir).map((p) => p.path);
}

export async function getSteamUserDataDirs() {
	const steamPath = await getSteamPath();
	return getSubDirs(path.join(steamPath.path, 'userdata'));
}

export async function getStellarisUserDataDir() {
	switch (os.platform()) {
		case 'linux': {
			return path.join(
				await platformPaths.home(),
				'.local',
				'share',
				'Paradox Interactive',
				'Stellaris',
			);
		}
		case 'darwin': {
			return path.join(await platformPaths.documents(), 'Paradox Interactive', 'Stellaris');
		}
		case 'win32': {
			return path.join(await platformPaths.documents(), 'Paradox Interactive', 'Stellaris');
		}
		default: {
			throw new Error('Unsupported OS');
		}
	}
}

export async function getStellarisDataPaths(installPath: string, glob: string) {
	const dataDirs = [installPath, ...getEnabledModDirs()];
	const fileMap = (
		await Promise.all(
			dataDirs.map(async (dir) => {
				const relativePaths = await fg.glob(glob, { cwd: dir, onlyFiles: true });
				return Object.fromEntries(
					relativePaths.map((relativePath) => [relativePath, path.join(dir, relativePath)]),
				);
			}),
		)
	).reduce((acc, cur) => ({ ...acc, ...cur }), {}); // mods later in load order overwrite same-name files
	return Object.values(fileMap).sort();
}

function getEnabledModDirs(): string[] {
	// no mod support for Electron for now
	return [];
}
