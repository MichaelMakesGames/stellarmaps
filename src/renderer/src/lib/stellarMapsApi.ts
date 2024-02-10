import { path, core } from '@tauri-apps/api';
import * as fs from '@tauri-apps/plugin-fs';
import * as dialog from '@tauri-apps/plugin-dialog';
import type { StellarMapsAPI } from '../../../shared/StellarMapsApi';
import { gameStateFilter } from './GameState';

const { invoke } = core;

let stellarMapsApi: StellarMapsAPI = (window as any).api; // this is from electron preload
if (stellarMapsApi == null) {
	// we're in tauri
	stellarMapsApi = {
		async loadSaveMetadata() {
			const saves: [StellarisSaveMetadata, ...StellarisSaveMetadata[]][] = await invoke(
				'get_stellaris_save_metadata_cmd',
			);
			return saves
				.map((save) => save.sort((a, b) => b.modified - a.modified))
				.filter((save) => save.length)
				.sort((a, b) => b[0].modified - a[0].modified);
		},
		loadSave(path) {
			return invoke('get_stellaris_save_cmd', { path, filter: gameStateFilter });
		},
		loadFonts() {
			return invoke('get_fonts_cmd');
		},
		revealFile(path) {
			return invoke('reveal_file_cmd', { path });
		},
		loadColors(path) {
			return invoke('get_stellaris_colors_cmd', { path });
		},
		loadLoc(path) {
			return invoke('get_stellaris_loc_cmd', { path });
		},
		loadStellarisInstallDir() {
			return invoke('get_stellaris_install_dir_cmd');
		},
		async loadEmblem(path, category, file) {
			return invoke('get_emblem_cmd', { path, category, file });
		},
		dialog,
		fs,
		path,
	};
}
export default stellarMapsApi;

export type StellarisSaveMetadata = Awaited<ReturnType<StellarMapsAPI['loadSaveMetadata']>>[0][0];
