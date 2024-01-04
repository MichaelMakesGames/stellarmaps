import type { GameState } from '$lib/GameState';
import type { MapSettings } from '$lib/mapSettings';
import { parseNumberEntry } from '$lib/utils';
import type processSystemOwnership from './processSystemOwnership';
import { getCountryColors } from './utils';

export default function processSystems(
	gameState: GameState,
	settings: MapSettings,
	systemIdToCountry: ReturnType<typeof processSystemOwnership>['systemIdToCountry'],
	knownCountries: Set<number>,
	knownSystems: Set<number>,
	systemIdToCoordinates: Record<number, [number, number]>,
) {
	const systems = Object.entries(gameState.galactic_object)
		.map(parseNumberEntry)
		.map(([systemId, system]) => {
			const countryId = systemIdToCountry[systemId];
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
			const x = -systemIdToCoordinates[systemId][0];
			const y = systemIdToCoordinates[systemId][1];

			const ownerIsKnown = countryId != null && knownCountries.has(countryId);
			const systemIsKnown = knownSystems.has(systemId);

			const bypassTypes = new Set(
				system.bypasses?.map((bypassId) => gameState.bypasses[bypassId]?.type),
			);
			const hasWormhole = bypassTypes.has('wormhole');
			const hasGateway = bypassTypes.has('gateway');
			const hasLGate = bypassTypes.has('lgate');
			const hasShroudTunnel = bypassTypes.has('shroud_tunnel');

			return {
				primaryColor,
				secondaryColor,
				isColonized,
				isSectorCapital,
				isCountryCapital,
				isOwned,
				ownerIsKnown,
				systemIsKnown,
				hasWormhole,
				hasGateway,
				hasLGate,
				hasShroudTunnel,
				x,
				y,
			};
		});
	return systems;
}
