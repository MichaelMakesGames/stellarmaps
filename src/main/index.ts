import { electronApp, is, optimizer } from '@electron-toolkit/utils';
import { BrowserWindow, app, dialog, ipcMain, shell } from 'electron';
import { join } from 'path';
import icon from '../../resources/icon.png?asset';
import { StellarMapsAPI } from '../shared/StellarMapsApi';
import { loadColors } from './loadColors';
import loadEmblem from './loadEmblem';
import loadFonts from './loadFonts';
import { loadLoc } from './loadLoc';
import loadSave from './loadSave';
import loadSaveMetadata from './loadSaveMetadata';
import loadStellarisInstallDir from './loadStellarisInstallDir';

function createWindow(): void {
	// Create the browser window.
	const mainWindow = new BrowserWindow({
		width: 1200,
		height: 900,
		show: false,
		autoHideMenuBar: true,
		...(process.platform === 'linux' ? { icon } : {}),
		webPreferences: {
			preload: join(__dirname, '../preload/index.js'),
			sandbox: false,
		},
	});

	mainWindow.on('ready-to-show', () => {
		mainWindow.maximize();
		mainWindow.webContents.openDevTools();
		mainWindow.show();
	});

	mainWindow.webContents.setWindowOpenHandler((details) => {
		shell.openExternal(details.url);
		return { action: 'deny' };
	});

	// HMR for renderer base on electron-vite cli.
	// Load the remote URL for development or the local html file for production.
	if (is.dev && process.env['ELECTRON_RENDERER_URL'] != null) {
		mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
	} else {
		mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
	}
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
	ipcMain.handle('loadSaveMetadata', loadSaveMetadata);
	ipcMain.handle('loadLoc', (_e, installPath) => loadLoc(installPath));
	ipcMain.handle('loadColors', (_e, installPath) => loadColors(installPath));
	ipcMain.handle('loadStellarisInstallDir', loadStellarisInstallDir);
	ipcMain.handle('loadSave', (_e, savePath) => loadSave(savePath));
	ipcMain.handle('loadFonts', loadFonts);
	ipcMain.handle('loadEmblem', (_e, installPath, category, file) =>
		loadEmblem(installPath, category, file),
	);
	ipcMain.handle('dialog.open', (_e, options: Parameters<StellarMapsAPI['dialog']['open']>[0]) => {
		return dialog
			.showOpenDialog({
				title: options.title,
				filters: options.filters,
				properties: [
					options.directory ? 'openDirectory' : 'openFile',
					...(options.multiple ? ['multiSelections' as const] : []),
				],
			})
			.then(({ filePaths }) => {
				if (filePaths.length === 0) {
					return null;
				} else {
					return options.multiple ? filePaths : filePaths[0];
				}
			});
	});
	ipcMain.handle('dialog.save', (_e, options: Parameters<StellarMapsAPI['dialog']['save']>[0]) => {
		return dialog
			.showSaveDialog({
				defaultPath: options.defaultPath,
				filters: options.filters,
			})
			.then(({ filePath }) => filePath ?? null);
	});
	// Set app user model id for windows
	electronApp.setAppUserModelId('games.michaelmakes.stellarmaps');

	// Default open or close DevTools by F12 in development
	// and ignore CommandOrControl + R in production.
	// see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
	app.on('browser-window-created', (_, window) => {
		optimizer.watchWindowShortcuts(window);
	});

	createWindow();

	app.on('activate', function () {
		// On macOS it's common to re-create a window in the app when the
		// dock icon is clicked and there are no other windows open.
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
