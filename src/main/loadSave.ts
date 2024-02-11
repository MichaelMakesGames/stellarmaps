import * as zipjs from '@zip.js/zip.js';
import fs from 'fs/promises';

export default async function loadSave(savePath: string) {
	const buffer = await fs.readFile(savePath);
	const blob = new Blob([buffer]);
	const zipReader = new zipjs.ZipReader(new zipjs.BlobReader(blob));
	const zipEntries = await zipReader.getEntries();
	const gameStateEntry = zipEntries.find((entry) => entry.filename === 'gamestate');
	if (gameStateEntry && gameStateEntry.getData) {
		const writer = new zipjs.TextWriter();
		const rawGameState = await gameStateEntry.getData(writer);
		zipReader.close();
		return rawGameState;
	}
	zipReader.close();
	throw new Error(`failed to load game state from ${savePath}`);
}
