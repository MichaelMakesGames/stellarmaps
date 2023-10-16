import type { GameState } from '$lib/GameState';
import type { MapSettings } from '$lib/mapSettings';
import type processSystemOwnership from './processSystemOwnership';
import { getCountryColors } from './utils';

export default function processSystems(
	gameState: GameState,
	settings: MapSettings,
	systemIdToCountry: ReturnType<typeof processSystemOwnership>['systemIdToCountry'],
	knownCountries: Set<number>,
	knownSystems: Set<number>,
) {
	const systems = Object.entries(gameState.galactic_object).map(([systemId, system]) => {
		const countryId = systemIdToCountry[parseInt(systemId)];
		const country = countryId != null ? gameState.country[countryId] : null;
		const colors = countryId != null ? getCountryColors(countryId, gameState, settings) : null;
		const primaryColor = colors?.[0] ?? 'black';
		const secondaryColor = colors?.[1] ?? 'black';

		const isOwned = country != null;
		const isColonized = isOwned && Boolean(system.colonies?.length);
		const isSectorCapital = Object.values(gameState.sectors).some((sector) =>
			system.colonies?.includes(sector.local_capital as number),
		);
		const isCountryCapital = system.colonies?.includes(country?.capital as number);
		const x = -system.coordinate.x;
		const y = system.coordinate.y;

		const ownerIsKnown = countryId != null && knownCountries.has(countryId);
		const systemIsKnown = knownSystems.has(parseInt(systemId));

		return {
			primaryColor,
			secondaryColor,
			isColonized,
			isSectorCapital,
			isCountryCapital,
			isOwned,
			ownerIsKnown,
			systemIsKnown,
			x,
			y,
		};
	});
	return systems;
}
