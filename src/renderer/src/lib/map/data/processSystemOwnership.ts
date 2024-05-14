import * as turf from '@turf/turf';

import type { GameState } from '../../GameState';
import type { MapSettings } from '../../settings';
import { getOrSetDefault } from '../../utils';
import { getFrontierSectorPseudoId, getUnionLeaderId, pointToGeoJSON } from './utils';

export const processSystemOwnershipDeps = [
	'unionMode',
	'unionFederations',
	'unionHegemonies',
	'unionSubjects',
	'unionFederationsColor',
] satisfies (keyof MapSettings)[];

export default function processSystemOwnership(
	gameState: GameState,
	settings: Pick<MapSettings, (typeof processSystemOwnershipDeps)[number]>,
	getSystemCoordinates: (id: number, options?: { invertX?: boolean }) => [number, number],
) {
	const fleetToCountry: Record<string, number> = {};
	Object.values(gameState.country).forEach((country) => {
		country.fleets_manager?.owned_fleets.forEach((owned_fleet) => {
			fleetToCountry[owned_fleet.fleet] = country.id;
		});
	});
	const sectorToSystemIds: Record<number, Set<number>> = {};
	const sectorToCountry: Record<number, number> = {};
	const countryToSystemIds: Record<string, Set<number>> = {};
	const unionLeaderToSystemIds: Record<string, Set<number>> = {};
	const unionLeaderToUnionMembers: Record<number, Set<number>> = {};
	const unionLeaderToSectors: Record<number, Set<number>> = {};
	const ownedSystemPoints: turf.Point[] = [];
	const systemIdToCountry: Record<string, number> = {};
	const systemIdToUnionLeader: Record<string, number> = {};
	for (const system of Object.values(gameState.galactic_object)) {
		const starbase =
			system.starbases[0] != null ? gameState.starbase_mgr.starbases[system.starbases[0]] : null;
		const starbaseShip = starbase == null ? null : gameState.ships[starbase.station];
		const ownerId = starbaseShip != null ? fleetToCountry[starbaseShip.fleet] : null;
		const owner = ownerId != null ? gameState.country[ownerId] : null;

		if (ownerId != null && owner != null) {
			const sector = Object.values(gameState.sectors).find(
				(s) => s.owner === ownerId && s.systems.includes(system.id),
			);
			const sectorId = sector != null ? sector.id : getFrontierSectorPseudoId(ownerId);
			getOrSetDefault(sectorToSystemIds, sectorId, new Set()).add(system.id);
			sectorToCountry[sectorId] = ownerId;
			const joinedUnionLeaderId = getUnionLeaderId(ownerId, gameState, settings, ['joinedBorders']);
			ownedSystemPoints.push(turf.point(pointToGeoJSON(getSystemCoordinates(system.id))).geometry);
			getOrSetDefault(countryToSystemIds, ownerId, new Set()).add(system.id);
			getOrSetDefault(unionLeaderToSystemIds, joinedUnionLeaderId, new Set()).add(system.id);
			getOrSetDefault(unionLeaderToUnionMembers, joinedUnionLeaderId, new Set()).add(ownerId);
			getOrSetDefault(unionLeaderToSectors, joinedUnionLeaderId, new Set()).add(sectorId);
			systemIdToCountry[system.id] = ownerId;
			systemIdToUnionLeader[system.id] = joinedUnionLeaderId;
		}
	}

	return {
		sectorToSystemIds,
		sectorToCountry,
		countryToSystemIds,
		unionLeaderToSystemIds,
		unionLeaderToUnionMembers,
		unionLeaderToSectors,
		ownedSystemPoints,
		systemIdToCountry,
		systemIdToUnionLeader,
	};
}
