import { getAppPath } from 'steam-path';

export default async function loadStellarisInstallDir() {
	const appPath = await getAppPath(281990);
	return appPath.path;
}
