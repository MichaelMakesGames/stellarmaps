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
	loadSave(savePath: string): Promise<unknown>;
	loadFonts(): Promise<string[]>;
	loadEmblem(installPath: string, category: string, file: string): Promise<string>;
	dialog: {
		open<
			T extends {
				directory: boolean;
				multiple: boolean;
				title: string;
			},
		>(
			options: T,
		): Promise<
			T['directory'] extends true
				? T['multiple'] extends true
					? string[] | null
					: string | null
				: T['multiple'] extends true
					? { path: string }[] | null
					: { path: string } | null
		>;
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
		writeFile: (path: string, data: Uint8Array) => Promise<void>;
		writeTextFile: (path: string, data: string) => Promise<void>;
	};
	revealFile: (path: string) => Promise<void>;
}
