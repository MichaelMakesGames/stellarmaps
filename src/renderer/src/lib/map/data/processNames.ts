import { get } from 'svelte/store';

import type { GameState, LocalizedText } from '../../GameState';
import { stellarisDataPromiseStore } from '../../loadStellarisData';
import { localizeTextSync } from './locUtils';

// _language is just here to control caching
export default async function processNames(gameState: GameState, _language: string) {
	const countryNames = await localizeEntityNames(gameState.country);
	const systemNames = await localizeEntityNames(gameState.galactic_object);
	return { countryNames, systemNames };
}

function localizeEntityNames(entities: Record<number, { id: number; name: LocalizedText }>) {
	return get(stellarisDataPromiseStore).then(({ loc }) => {
		return Object.fromEntries<string>(
			Object.values(entities).map(
				(entity) => [entity.id, localizeTextSync(entity.name, loc)] as const,
			),
		) as Record<number, string>;
	});
}
