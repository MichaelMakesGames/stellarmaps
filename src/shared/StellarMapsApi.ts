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
		open(options: {
			directory: boolean;
			multiple: boolean;
			title: string;
			filters?: { extensions: string[]; name: string }[];
		}): Promise<null | string | string[]>;
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
		writeFile: (path: string, content: string) => Promise<void>;
		writeBinaryFile: (path: string, content: ArrayBuffer) => Promise<void>;
		readTextFile: (path: string) => Promise<string>;
		createDir: (path: string, options: { recursive: boolean }) => Promise<void>;
		exists: (path: string) => Promise<boolean>;
	};
	revealFile: (path: string) => Promise<void>;
}
