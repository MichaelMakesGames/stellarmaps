import type { GameState } from '../../GameState';
import type { MapSettings } from '../../mapSettings';
import { isDefined } from '../../utils';
import type processSystemOwnership from './processSystemOwnership';
import { getCountryColors } from './utils';

export const processSystemsDeps = [
	'unionMode',
	'unionFederations',
	'unionSubjects',
	'unionFederationsColor',
] satisfies (keyof MapSettings)[];

export default function processSystems(
	gameState: GameState,
	settings: Pick<MapSettings, (typeof processSystemsDeps)[number]>,
	systemIdToCountry: ReturnType<typeof processSystemOwnership>['systemIdToCountry'],
	knownCountries: Set<number>,
	knownSystems: Set<number>,
	getSystemCoordinates: (id: number, options?: { invertX?: boolean }) => [number, number],
) {
	const systems = Object.values(gameState.galactic_object).map((system) => {
		const countryId = systemIdToCountry[system.id];
		const country = countryId != null ? gameState.country[countryId] : null;
		const colors = countryId != null ? getCountryColors(countryId, gameState, settings) : null;
		const primaryColor = colors?.[0] ?? 'black';
		const secondaryColor = colors?.[1] ?? 'black';

		const isOwned = country != null;
		const isColonized = isOwned && Boolean(system.colonies.length);
		const isSectorCapital = Object.values(gameState.sectors).some((sector) =>
			system.colonies.includes(sector.local_capital as number),
		);
		const isCountryCapital = system.colonies.includes(country?.capital as number);
		const [x, y] = getSystemCoordinates(system.id, { invertX: true });

		const ownerIsKnown = countryId != null && knownCountries.has(countryId);
		const systemIsKnown = knownSystems.has(system.id);

		const bypassTypes = new Set(
			system.bypasses.map((bypassId) => gameState.bypasses[bypassId]?.type).filter(isDefined),
		);
		const hasWormhole = bypassTypes.has('wormhole');
		const hasGateway = bypassTypes.has('gateway');
		const hasLGate = bypassTypes.has('lgate');
		const hasShroudTunnel = bypassTypes.has('shroud_tunnel');

		return {
			id: system.id,
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
