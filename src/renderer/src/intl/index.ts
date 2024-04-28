import IntlMessageFormat, { type FormatXMLElementFn, type PrimitiveType } from 'intl-messageformat';
import { derived, writable } from 'svelte/store';
import enUS from './en-US';

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
	placeholder: flattenMessages(enUS) as Partial<Record<MessageID, string>>,
};
type Locale = keyof typeof locales;

console.warn(locales);

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

const locale = writable<Locale>(getBestLocale());

export const t = derived(locale, (localeKey) => {
	const messages: Record<string, IntlMessageFormat> = {};
	return function t(
		messageId: MessageID,
		values?: Record<string, PrimitiveType | FormatXMLElementFn<string>>,
	) {
		const message =
			messages[messageId] ??
			new IntlMessageFormat(
				locales[localeKey][messageId] ?? locales['en-US'][messageId],
				localeKey,
			);
		if (values) {
			console.warn(message.format(values));
		}
		return `${message.format(values)}`;
	};
});
