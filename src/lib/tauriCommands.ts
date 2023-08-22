import { invoke } from '@tauri-apps/api';
import { jsonify, tokenize } from './parseSave';

export async function loadColors() {
	const rawContent = await invoke('get_stellaris_colors_cmd');
	const parsed = jsonify(tokenize(rawContent as string)) as Record<
		string,
		{ color: [number, number, number, number] }
	>;
	return Object.fromEntries(
		Object.entries(parsed).map(([key, value]) => [
			key,
			`rgba(${value.color[0]}, ${value.color[1]}, ${value.color[2]}, ${value.color[3] / 255})`,
		]),
	);
}

export interface StellarisSaveMetadata {
	name: string;
	date: string;
	path: string;
	modified: number;
}
export async function loadSaveMetadata() {
	const saves: StellarisSaveMetadata[][] = await invoke('get_stellaris_save_metadata_cmd');
	return saves
		.map((save) => save.sort((a, b) => b.modified - a.modified))
		.filter((save) => save.length)
		.sort((a, b) => b[0].modified - a[0].modified);
}

export function loadSave(path: string) {
	return invoke('get_stellaris_save_cmd', { path }) as Promise<string>;
}
