import { invoke } from '@tauri-apps/api';

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

export function loadFonts() {
	return invoke<string[]>('get_fonts_cmd');
}

export function reveal_file(path: string) {
	invoke('reveal_file_cmd', { path });
}
