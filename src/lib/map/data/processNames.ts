import type { Country, GameState, LocalizedText } from '$lib/GameState';
import { stellarisDataPromiseStore } from '$lib/loadStellarisData';
import { countryOptions } from '$lib/mapSettings';
import { get } from 'svelte/store';

export default async function processNames(gameState: GameState) {
	const countryNames = await localizeCountryNames(gameState.country);
	countryOptions.set(
		Object.entries(countryNames)
			.map(([id, name]) => ({ id, name }))
			.filter(({ id }) => gameState.country[parseInt(id)]?.type === 'default'),
	);
	return countryNames;
}

function localizeCountryNames(countries: Record<number, Country>) {
	return get(stellarisDataPromiseStore).then(({ loc }) => {
		return Object.fromEntries(
			Object.entries(countries)
				.map<[number, Country]>(([id, c]) => [parseInt(id), c])
				.filter(
					(entry): entry is [number, Country & Required<Pick<Country, 'name'>>] =>
						entry[1].name != null,
				)
				.map(([id, c]) => [id, localizeText(c.name, loc)]),
		);
	});
}

function localizeText(text: LocalizedText, loc: Record<string, string>): string {
	if (text.key === '%ADJECTIVE%') {
		try {
			const var0 = text.variables?.[0];
			const var1 = text.variables?.[1];
			if (!var0) throw new Error();
			return loc['adj_format']
				.replace('adj', localizeText(var0.value, loc))
				.replace('$1$', var1 ? localizeText(var1.value, loc) : '');
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
				return localizeText(var0.value, loc);
			} else {
				return loc['adj_format']
					.replace('adj', adj)
					.replace('$1$', localizeText(var0.value.variables[0].value, loc));
			}
		} catch {
			console.warn('localization failed', text);
			return 'LOCALIZATION FAILED';
		}
	}
	if (!loc[text.key]) return text.key;
	let value = loc[text.key];
	if (text.variables) {
		text.variables.forEach((variable) => {
			const localizedVariable = localizeText(variable.value, loc);
			value = value
				.replace(`$${variable.key}$`, localizedVariable)
				.replace(`[${variable.key}]`, localizedVariable)
				.replace(`<${variable.key}>`, localizedVariable);
		});
	}
	return value;
}
