import type { AppSettingConfig } from './SettingConfig';

export const appSettingsConfig: AppSettingConfig[] = [
	{
		id: 'appLocale',
		type: 'select',
		tooltip: 'setting.appLocale_tooltip',
		options: [
			{ id: 'en-US', literalName: 'English' },
			{ id: 'ENGLISH', literalName: 'ENGLISH' },
		],
	},
	{
		id: 'appStellarisLanguage',
		type: 'select',
		options: [
			{ id: 'l_english', literalName: 'English' },
			{ id: 'l_braz_por', literalName: 'Português do Brasil' },
			{ id: 'l_german', literalName: 'Deutsch' },
			{ id: 'l_french', literalName: 'Français' },
			{ id: 'l_spanish', literalName: 'Español' },
			{ id: 'l_polish', literalName: 'Polski' },
			{ id: 'l_russian', literalName: 'Русский' },
			{ id: 'l_simp_chinese', literalName: '中文' },
			{ id: 'l_japanese', literalName: '日本語' },
			{ id: 'l_korean', literalName: '한국어' },
		],
		tooltip: 'setting.appStellarisLanguage_tooltip',
	},
	{
		id: 'appTranslatorMode',
		type: 'toggle',
		tooltip: 'setting.appTranslatorMode_tooltip',
	},
];
