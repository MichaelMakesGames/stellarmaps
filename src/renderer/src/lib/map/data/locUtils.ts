import { get } from 'svelte/store';
import type { LocalizedText } from '../../GameState';
import { stellarisDataPromiseStore } from '../../loadStellarisData';

export function localizeText(text: LocalizedText) {
	return get(stellarisDataPromiseStore).then(({ loc }) => localizeTextSync(text, loc));
}

export function localizeTextSync(
	text: null | LocalizedText,
	loc: Record<string, string | undefined>,
): string {
	if (text == null) return 'null';
	if (text.key === '%ADJECTIVE%') {
		try {
			const var0 = text.variables?.[0];
			const var1 = text.variables?.[1];
			if (!var0) throw new Error();
			return (loc['adj_format'] ?? 'adj $1$')
				.replace('adj', localizeTextSync(var0.value, loc))
				.replace('$1$', var1 ? localizeTextSync(var1.value, loc) : '');
		} catch {
			console.warn('localization failed', text);
			return 'LOCALIZATION FAILED';
		}
	} else if (text.key === '%ADJ%') {
		try {
			const var0 = text.variables?.[0];
			if (!var0 || !var0.value.variables) throw new Error();
			const adj = loc[var0.value.key] ?? var0.value.key;
			if (adj.includes('$1$')) {
				return localizeTextSync(var0.value, loc);
			} else {
				return (loc['adj_format'] ?? 'adj $1$')
					.replace('adj', adj)
					.replace('$1$', localizeTextSync(var0.value.variables[0].value, loc));
			}
		} catch {
			console.warn('localization failed', text);
			return 'LOCALIZATION FAILED';
		}
	}
	let value = loc[text.key];
	if (value == null) return text.key;
	if (text.variables) {
		text.variables.forEach((variable) => {
			const localizedVariable = localizeTextSync(variable.value, loc);
			value = (value as string)
				.replace(`$${variable.key}$`, localizedVariable)
				.replace(`[${variable.key}]`, localizedVariable)
				.replace(`<${variable.key}>`, localizedVariable);
		});
	}
	return value;
}
