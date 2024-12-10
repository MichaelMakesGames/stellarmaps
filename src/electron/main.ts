import path from 'node:path';
import { parseArgs } from 'node:util';

import { app, BrowserWindow, ipcMain, nativeImage, session, shell } from 'electron';

import icon from '../../resources/icon.png?inline';

const { values: args } = parseArgs({
	args: process.argv,
	options: {
		__PORT__: { type: 'string' },
		__INVOKE_KEY__: { type: 'string' },
		__ORIGIN__: { type: 'string' },
	},
	allowPositionals: true,
});

const createWindow = () => {
	// Create the browser window.
	const mainWindow = new BrowserWindow({
		width: 1200,
		height: 900,
		webPreferences: {
			preload: path.join(import.meta.dirname, 'preload.js'),
		},
		title: 'StellarMaps',
		icon: nativeImage.createFromDataURL(icon),
	});

	// and load the index.html of the app.
	// @ts-expect-error -- provided by @electron-forge/plugin-vite
	// eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
	if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
		// @ts-expect-error -- provided by @electron-forge/plugin-vite
		mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
	} else {
		mainWindow.loadFile(
			// @ts-expect-error -- provided by @electron-forge/plugin-vite
			path.join(import.meta.dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
		);
	}

	ipcMain.handle('get-args', () => args);

	mainWindow.webContents.setWindowOpenHandler(({ url }) => {
		shell.openExternal(url);
		return { action: 'deny' };
	});

	mainWindow.removeMenu();
	mainWindow.maximize();
	if (process.env.NODE_ENV === 'development') {
		mainWindow.webContents.openDevTools();
	}
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
	createWindow();
	// tauri invoke http validates the origin, which we fake here
	session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
		details.requestHeaders['Origin'] = args.__ORIGIN__ ?? 'tauri://localhost';
		callback({ requestHeaders: details.requestHeaders });
	});
	session.defaultSession.webRequest.onHeadersReceived(
		{ urls: [`http://localhost:${args.__PORT__}/*`] },
		(details, callback) => {
			if (details.responseHeaders) {
				details.responseHeaders['Access-Control-Allow-Origin'] = ['*'];
			}
			callback({ responseHeaders: details.responseHeaders });
		},
	);
});

// when closed, send electron_closed command to tauri
app.on('window-all-closed', async () => {
	await fetch(`http://localhost:${args.__PORT__}/main/electron_closed`, {
		method: 'POST',
		body: '{}',
		headers: {
			'Content-Type': 'application/json',
			'Tauri-Callback': '12345',
			'Tauri-Error': '12345',
			'Tauri-Invoke-Key': args.__INVOKE_KEY__ ?? '',
			Origin: args.__ORIGIN__ ?? 'tauri://localhost',
		},
	});
	app.quit();
});
