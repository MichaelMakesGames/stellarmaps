/* eslint-disable */
// @ts-nocheck

const { contextBridge, ipcRenderer } = require('electron/renderer');

let __PORT__ = null;
let __INVOKE_KEY__ = null;
const ready = ipcRenderer.invoke('get-args').then((args) => {
	__PORT__ = args.PORT;
	__INVOKE_KEY__ = args.INVOKE_KEY;
});
const CALLBACKS = {};
const __TAURI_INTERNALS__ = {
	metadata: { currentWindow: { label: 'main' } },
	invoke(cmd, payload, options) {
		return new Promise(async (resolve, reject) => {
			const callback = window.crypto.getRandomValues(new Uint32Array(1))[0]?.toString() ?? '';
			const error = window.crypto.getRandomValues(new Uint32Array(1))[0]?.toString() ?? '';
			CALLBACKS[callback] = (data) => {
				resolve(data);
				delete CALLBACKS[callback];
				delete CALLBACKS[error];
			};
			CALLBACKS[error] = (data) => {
				reject(data);
				delete CALLBACKS[callback];
				delete CALLBACKS[error];
			};
			await ready;
			sendIpcMessage({ cmd, callback, error, payload, options });
		});
	},
};

contextBridge.exposeInMainWorld('__TAURI_INTERNALS__', __TAURI_INTERNALS__);

// adapted from https://github.com/tauri-apps/tauri-invoke-http/blob/v2/src/invoke_system.js
// see the tauri-electron comments for where changes have been made
function processIpcMessage(message) {
	if (message instanceof ArrayBuffer || ArrayBuffer.isView(message) || Array.isArray(message)) {
		return {
			contentType: 'application/octet-stream',
			data: message,
		};
	} else {
		const data = JSON.stringify(message, (_k, val) => {
			if (val instanceof Map) {
				let o = {};
				val.forEach((v, k) => (o[k] = v));
				return o;
			} else if (val instanceof Uint8Array) {
				return Array.from(val);
			} else if (val instanceof ArrayBuffer) {
				return Array.from(new Uint8Array(val));
			} else if (
				val instanceof Object &&
				'__TAURI_CHANNEL_MARKER__' in val &&
				typeof val.id === 'number'
			) {
				return `__CHANNEL__:${val.id}`;
			} else {
				return val;
			}
		});

		return {
			contentType: 'application/json',
			data,
		};
	}
}

// tauri-electron: use __PORT__ directly
// const port = __PORT__;

function sendIpcMessage(message) {
	const { cmd, callback, error, payload, options } = message;

	const { contentType, data } = processIpcMessage(payload);
	const windowLabel = __TAURI_INTERNALS__.metadata.currentWindow.label; // tauri-electron: use __TAURI_INTERNALS__, not window.__TAURI_INTERNALS__
	fetch(`http://localhost:${__PORT__}/${windowLabel}/${cmd}`, {
		// tauri-electron: use __PORT__, not port
		method: 'POST',
		body: data,
		headers: {
			'Content-Type': contentType,
			'Tauri-Callback': callback,
			'Tauri-Error': error,
			'Tauri-Invoke-Key': __INVOKE_KEY__,
			...((options && options.headers) || {}),
		},
	})
		.then((response) => {
			const cb = response.headers.get('Tauri-Response') === 'ok' ? callback : error;
			// we need to split here because on Android the content-type gets duplicated
			switch ((response.headers.get('content-type') || '').split(',')[0]) {
				case 'application/json':
					return response.json().then((r) => [cb, r]);
				case 'text/plain':
					return response.text().then((r) => [cb, r]);
				default:
					return response.arrayBuffer().then((r) => [cb, r]);
			}
		})
		.then(([cb, data]) => {
			// tauri-electron: check CALLBACKS[cb] instead of window[`_${cb}`]
			if (CALLBACKS[cb]) {
				CALLBACKS[cb](data);
			} else {
				console.warn(
					`[TAURI] Couldn't find callback id {cb} in CALLBACKS. This might happen when the app is reloaded while Rust is running an asynchronous operation.`,
				);
			}
		});
}
