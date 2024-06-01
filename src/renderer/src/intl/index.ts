import IntlMessageFormat, { type FormatXMLElementFn, type PrimitiveType } from 'intl-messageformat';
import { derived, writable } from 'svelte/store';
import enUS from './en-US';
import jaJP from './ja-JP';
import zhTW from './zh-TW';

type Paths<T> = T extends object
	? {
			[K in keyof T]: `${Exclude<K, symbol>}${Paths<T[K]> extends never ? '' : `.${Paths<T[K]>}`}`;
		}[keyof T]
	: never;

export type MessageID = Paths<typeof enUS>;

type UnflattenedMessages = { [key: string]: string | UnflattenedMessages };
function flattenMessages(messages: UnflattenedMessages, prefix = ''): Record<string, string> {
	return Object.fromEntries(
		Object.entries(messages).flatMap(([k, v]) =>
			typeof v === 'string'
				? [[`${prefix}${k}`, v]]
				: Object.entries(flattenMessages(v, `${prefix}${k}.`)),
		),
	);
}

const locales = {
	'en-US': flattenMessages(enUS) as Record<MessageID, string>,
	'ja-JP': flattenMessages(jaJP) as Partial<Record<MessageID, string>>,
	'zh-TW': flattenMessages(zhTW) as Partial<Record<MessageID, string>>,
	ENGLISH: Object.fromEntries(
		Object.entries(flattenMessages(enUS)).map(([k, v]) => [k, v.toUpperCase()]),
	) as Partial<Record<MessageID, string>>,
	MessageID: Object.fromEntries(Object.keys(flattenMessages(enUS)).map((k) => [k, k])) as Record<
		MessageID,
		string
	>,
};
type Locale = keyof typeof locales;

function getBestLocale(): Locale {
	const keys = Object.keys(locales) as [Locale, ...Locale[]];
	return (
		// exact match
		keys.find((key) => key === navigator.language) ??
		// otherwise first matching language
		keys.find((key) => key.startsWith(`${navigator.language.split('-')[0]}-`)) ??
		// otherwise first (en-US)
		keys[0]
	);
}

export const locale = writable<Locale>(getBestLocale());

export const translatorModeMessages = writable<Record<string, string>>({});
export const translatorModeExtraMessageIDs = derived(translatorModeMessages, (messages) =>
	Object.keys(messages).filter((key) => !(key in locales['en-US'])),
);
export const translatorModeUntranslatedMessageIDs = derived(translatorModeMessages, (messages) =>
	Object.keys(locales['en-US']).filter(
		(key) => !(key in messages) || messages[key] === locales['en-US'][key as MessageID],
	),
);

export const t = derived(
	[locale, translatorModeMessages],
	([localeKey, translatorModeMessages]) => {
		const messages: Record<string, IntlMessageFormat> = {};
		return function t(
			messageId: MessageID,
			values?: Record<string, PrimitiveType | FormatXMLElementFn<string>>,
		) {
			if (localeKey === 'MessageID') return messageId;
			const message =
				messages[messageId] ??
				new IntlMessageFormat(
					translatorModeMessages[messageId] ??
						locales[localeKey][messageId] ??
						locales['en-US'][messageId],
					localeKey,
				);
			return `${message.format(values)}`;
		};
	},
);
