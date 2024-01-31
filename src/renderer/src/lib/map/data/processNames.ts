import type { Country, GameState } from '../../GameState';
import { stellarisDataPromiseStore } from '../../loadStellarisData';
import { countryOptions } from '../../mapSettings';
import { get } from 'svelte/store';
import { localizeTextSync } from './locUtils';

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
				.map(([id, c]) => [id, localizeTextSync(c.name, loc)]),
		);
	});
}
