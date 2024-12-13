import path from 'node:path';
import { parseArgs } from 'node:util';

import { app, BrowserWindow, ipcMain, nativeImage, session, shell } from 'electron';
import { z } from 'zod';

import icon from '../../resources/icon.png?inline';

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

const args = z
	.object({
		PORT: z.coerce.number().int().min(1),
		INVOKE_KEY: z.string(),
		ORIGIN: z.string().url(),
	})
	.parse(
		parseArgs({
			args: process.argv,
			options: {
				PORT: { type: 'string' },
				INVOKE_KEY: { type: 'string' },
				ORIGIN: { type: 'string' },
			},
			allowPositionals: true,
		}).values,
	);

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
	mainWindow.removeMenu();
	mainWindow.maximize();

	// load the index.html of the app.
	if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
		mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
	} else {
		mainWindow.loadFile(
			path.join(import.meta.dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
		);
	}

	// open _blank links in system default browser
	mainWindow.webContents.setWindowOpenHandler(({ url }) => {
		shell.openExternal(url);
		return { action: 'deny' };
	});

	// open dev tools on F12 / Ctrl+Shfit+I / Cmd+Opt+I
	mainWindow.webContents.on('before-input-event', (_, input) => {
		if (
			input.type === 'keyDown' &&
			(input.key === 'F12' ||
				(input.control && input.shift && input.key === 'I') ||
				(input.meta && input.alt && input.key === 'I'))
		) {
			mainWindow.webContents.toggleDevTools();
		}
	});

	// open dev tools in dev mode
	if (!app.isPackaged) {
		mainWindow.webContents.openDevTools();
	}
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
	// set up get-args ipc, which is used by preload script
	ipcMain.handle('get-args', () => args);

	// fake the origin for tauri invoke requests
	session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
		details.requestHeaders['Origin'] = args.ORIGIN;
		callback({ requestHeaders: details.requestHeaders });
	});

	// wildcard cors for tauri invoke requests
	session.defaultSession.webRequest.onHeadersReceived(
		{ urls: [`http://localhost:${args.PORT}/*`] },
		(details, callback) => {
			callback({
				responseHeaders: {
					...details.responseHeaders,
					'Access-Control-Allow-Origin': ['*'],
				},
			});
		},
	);

	// finally, create the window
	createWindow();
});

// when closed, send electron_closed command to tauri
app.on('window-all-closed', async () => {
	await fetch(`http://localhost:${args.PORT}/main/electron_closed`, {
		method: 'POST',
		body: '{}',
		headers: {
			'Content-Type': 'application/json',
			'Tauri-Callback': '12345',
			'Tauri-Error': '12345',
			'Tauri-Invoke-Key': args.INVOKE_KEY,
			Origin: args.ORIGIN,
		},
	});
	app.quit();
});
