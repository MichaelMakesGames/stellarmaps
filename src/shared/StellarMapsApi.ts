import type { OpenDialogReturn } from '@tauri-apps/plugin-dialog';

interface StellarisSaveMetadata {
	name: string;
	date: string;
	path: string;
	modified: number;
}

export interface StellarMapsAPI {
	loadSaveMetadata(): Promise<[StellarisSaveMetadata, ...StellarisSaveMetadata[]][]>;
	loadLoc(installPath: string, language: string): Promise<Record<string, string>>;
	loadColors(installPath: string): Promise<string[]>;
	loadStellarisInstallDir(): Promise<string>;
	loadSave(savePath: string): Promise<unknown>;
	loadFonts(): Promise<string[]>;
	loadEmblem(installPath: string, category: string, file: string): Promise<string>;
	dialog: {
		open<
			T extends {
				directory: boolean;
				multiple: boolean;
				title: string;
				filters?: { extensions: string[]; name: string }[];
			},
		>(
			options: T,
		): Promise<OpenDialogReturn<T>>;
		save(options: {
			defaultPath: string;
			filters: { extensions: string[]; name: string }[];
		}): Promise<null | string>;
	};
	path: {
		join(...paths: string[]): Promise<string>;
		pictureDir(): Promise<string>;
		appConfigDir(): Promise<string>;
	};
	fs: {
		writeFile: (path: string, data: Uint8Array) => Promise<void>;
		writeTextFile: (path: string, data: string) => Promise<void>;
		readTextFile: (path: string) => Promise<string>;
		mkdir: (path: string, options: { recursive: boolean }) => Promise<void>;
		exists: (path: string) => Promise<boolean>;
	};
	revealFile: (path: string) => Promise<void>;
}
