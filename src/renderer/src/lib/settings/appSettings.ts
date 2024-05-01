import { localStorageStore } from '@skeletonlabs/skeleton';
import { get } from 'svelte/store';
import { locale } from '../../intl';
import stellarMapsApi from '../stellarMapsApi';
import { disableTranslatorMode, enableTranslatorMode } from '../translatorMode';

export type StringAppSettings = 'appLocale' | 'appStellarisLanguage';
export type BooleanAppSettings = 'appTranslatorMode';
export type AppSettings = Record<StringAppSettings, string> & Record<BooleanAppSettings, boolean>;

async function getAppSettingsPath() {
	return await stellarMapsApi.path.join(await stellarMapsApi.path.appConfigDir(), 'settings.json');
}

async function createAppConfigDirIfNeeded() {
	const path = await stellarMapsApi.path.appConfigDir();
	const exists: boolean = await stellarMapsApi.fs.exists(path);
	if (!exists) {
		await stellarMapsApi.fs.createDir(path, { recursive: true });
	}
}

const defaultAppSettings: AppSettings = {
	appLocale: get(locale),
	appStellarisLanguage: 'l_english',
	appTranslatorMode: false,
};

export const appSettings = localStorageStore('appSettings', defaultAppSettings);

function loadSettings() {
	return getAppSettingsPath()
		.then((path) => stellarMapsApi.fs.readTextFile(path))
		.then((contents) => JSON.parse(contents))
		.catch((reason) => {
			console.error(reason);
			return defaultAppSettings;
		})
		.then((settings) => appSettings.set(settings))
		.then(() => {
			appSettings.subscribe((settings) => {
				locale.set(settings.appLocale as Parameters<(typeof locale)['set']>[0]);
				createAppConfigDirIfNeeded()
					.then(getAppSettingsPath)
					.then((path) => stellarMapsApi.fs.writeFile(path, JSON.stringify(settings)));
				if (settings.appTranslatorMode) {
					enableTranslatorMode();
				} else {
					disableTranslatorMode();
				}
			});
		});
}
loadSettings();
