import { contextBridge, shell } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';
import path from 'path';
import { platformPaths } from 'platform-paths';
import fs from 'fs/promises';
import { StellarMapsAPI } from '../shared/StellarMapsApi';

const api: StellarMapsAPI = {
	// custom commands
	loadSaveMetadata: () => electronAPI.ipcRenderer.invoke('loadSaveMetadata'),
	loadLoc: (installPath) => electronAPI.ipcRenderer.invoke('loadLoc', installPath),
	loadColors: (installPath) => electronAPI.ipcRenderer.invoke('loadColors', installPath),
	loadStellarisInstallDir: () => electronAPI.ipcRenderer.invoke('loadStellarisInstallDir'),
	loadSave: (savePath) => electronAPI.ipcRenderer.invoke('loadSave', savePath),
	loadFonts: () => electronAPI.ipcRenderer.invoke('loadFonts'),
	loadEmblem: (installPath, category, file) =>
		electronAPI.ipcRenderer.invoke('loadEmblem', installPath, category, file),

	// implement Tauri api (just the parts I need)
	dialog: {
		open: (options) => electronAPI.ipcRenderer.invoke('dialog.open', options),
		save: (options) => electronAPI.ipcRenderer.invoke('dialog.save', options),
	},
	path: {
		join: (...paths: string[]) => Promise.resolve(path.join(...paths)),
		pictureDir: () => platformPaths.pictures(),
	},
	fs: {
		writeFile: (path, content) => fs.writeFile(path, content, { encoding: 'utf-8' }),
		writeBinaryFile: (path, content) => fs.writeFile(path, new DataView(content)),
	},
	revealFile: (path) => Promise.resolve(shell.showItemInFolder(path)),
};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
	try {
		contextBridge.exposeInMainWorld('api', api);
	} catch (error) {
		console.error(error);
	}
} else {
	// @ts-expect-error (define in dts)
	window.api = api;
}
