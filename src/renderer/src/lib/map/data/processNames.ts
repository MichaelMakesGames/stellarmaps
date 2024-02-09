import type { Country, GameState } from '../../GameState';
import { stellarisDataPromiseStore } from '../../loadStellarisData';
import { get } from 'svelte/store';
import { localizeTextSync } from './locUtils';

export default async function processNames(gameState: GameState) {
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
