export interface StellarisSaveMetadata {
	name: string;
	date: string;
	path: string;
	modified: number;
}

export interface StellarMapsAPI {
	loadSaveMetadata(): Promise<StellarisSaveMetadata[][]>;
	loadLoc(installPath: string): Promise<Record<string, string>>;
	loadColors(installPath: string): Promise<string[]>;
	loadStellarisInstallDir(): Promise<string>;
	loadSave(savePath: string): Promise<string>;
	loadFonts(): Promise<string[]>;
	loadEmblem(installPath: string, category: string, file: string): Promise<string>;
	dialog: {
		open(options: {
			directory: boolean;
			multiple: boolean;
			title: string;
		}): Promise<null | string | string[]>;
		save(options: {
			defaultPath: string;
			filters: { extensions: string[]; name: string }[];
		}): Promise<null | string>;
	};
	path: {
		join(...paths: string[]): Promise<string>;
		pictureDir(): Promise<string>;
	};
	fs: {
		writeFile: (path: string, content: string) => Promise<void>;
		writeBinaryFile: (path: string, content: ArrayBuffer) => Promise<void>;
	};
	revealFile: (path: string) => Promise<void>;
}
