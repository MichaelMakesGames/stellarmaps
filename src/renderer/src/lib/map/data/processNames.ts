import { get } from 'svelte/store';
import type { Country, GameState } from '../../GameState';
import { stellarisDataPromiseStore } from '../../loadStellarisData';
import { localizeTextSync } from './locUtils';

// _language is just here to control caching
export default async function processNames(gameState: GameState, _language: string) {
	const countryNames = await localizeCountryNames(gameState.country);
	return countryNames;
}

function localizeCountryNames(countries: Record<number, Country>) {
	return get(stellarisDataPromiseStore).then(({ loc }) => {
		return Object.fromEntries<string | undefined>(
			Object.values(countries).map((c) => [c.id, localizeTextSync(c.name, loc)] as const),
		);
	});
}
