import * as zipjs from '@zip.js/zip.js';
import { existsSync } from 'fs';
import fs from 'fs/promises';
import path from 'path';
import { getSteamUserDataDirs, getStellarisUserDataDir, getSubDirs } from './fsUtils';

export default async function loadSaveMetadata() {
	const steamUserDataDirs = await getSteamUserDataDirs();
	const saveDirs = [
		...steamUserDataDirs.map((dir) => path.join(dir, '281990', 'remote', 'save games')),
		path.join(await getStellarisUserDataDir(), 'save games'),
	].filter((p) => existsSync(p));
	const campaignDirs = (await Promise.all(saveDirs.map((dir) => getSubDirs(dir)))).flat();
	const allSavesMetadata = await Promise.all(
		campaignDirs.map(async (dir) => {
			const saves = (await fs.readdir(dir))
				.filter((p) => path.extname(p) === '.sav')
				.map((p) => path.join(dir, p));
			const campaignSavesMetadata = await Promise.all(
				saves.map(async (p) => {
					let date = '';
					let name = path.basename(p);
					const buffer = await fs.readFile(p);
					const blob = new Blob([buffer]);
					const zipReader = new zipjs.ZipReader(new zipjs.BlobReader(blob));
					const zipEntries = await zipReader.getEntries();
					const metadataEntry = zipEntries.find((entry) => entry.filename === 'meta');
					if (metadataEntry && metadataEntry.getData) {
						const writer = new zipjs.TextWriter();
						const rawMetadata = await metadataEntry.getData(writer);
						date = rawMetadata.match(/^date="(.*)"$/m)?.[1] ?? date;
						name = rawMetadata.match(/^name="(.*)"$/m)?.[1] ?? name;
					}
					zipReader.close();
					const stats = await fs.lstat(p);
					return {
						name,
						date,
						path: p,
						modified: stats.mtimeMs,
					};
				}),
			);
			campaignSavesMetadata.sort((a, b) => b.modified - a.modified);
			return campaignSavesMetadata;
		}),
	);
	return allSavesMetadata
		.filter((campaign) => campaign.length >= 1)
		.toSorted((a, b) => b[0].modified - a[0].modified);
}
