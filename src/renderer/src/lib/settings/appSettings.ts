import { localStorageStore } from '@skeletonlabs/skeleton';
import { derived, get } from 'svelte/store';

import { isValidLocale, locale } from '../../intl';
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
		await stellarMapsApi.fs.mkdir(path, { recursive: true });
	}
}

const defaultAppSettings: AppSettings = {
	appLocale: get(locale),
	appStellarisLanguage: 'l_english',
	appTranslatorMode: false,
};

export const appSettings = localStorageStore('appSettings', defaultAppSettings);
export const appStellarisLanguage = derived(appSettings, (value) => value.appStellarisLanguage);
export const appStellarisLanguageCode = derived(
	appStellarisLanguage,
	(value) =>
		({
			l_english: 'en-US',
			l_braz_por: 'pt-BR',
			l_german: 'de-DE',
			l_french: 'fr-FR',
			l_spanish: 'es-ES',
			l_polish: 'pl-PL',
			l_russian: 'ru-RU',
			l_simp_chinese: 'zh-CN',
			l_japanese: 'ja-JP',
			l_korean: 'ko-KR',
		})[value] ?? 'en-US',
);
export const appStellarisLanguageOrdinals = derived(
	appStellarisLanguage,
	(value): Record<string, string> =>
		({
			l_english: { one: 'st', two: 'nd', few: 'rd', other: 'th' },
			// TODO? implement other languages
		})[value] ?? {},
);

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
				// update locale if valid
				if (isValidLocale(settings.appLocale)) {
					locale.set(settings.appLocale as Parameters<(typeof locale)['set']>[0]);
				} else {
					// change settings if it somehow has an invalid locale
					appSettings.update((value) => ({ ...value, appLocale: get(locale) }));
					return;
				}

				// write to file
				createAppConfigDirIfNeeded()
					.then(getAppSettingsPath)
					.then((path) => stellarMapsApi.fs.writeTextFile(path, JSON.stringify(settings)));
				// toggle translator mode
				if (settings.appTranslatorMode) {
					enableTranslatorMode();
				} else {
					disableTranslatorMode();
				}
			});
		});
}
loadSettings();
