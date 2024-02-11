import * as helpers from '@turf/helpers';
import type { Delaunay, Voronoi } from 'd3-delaunay';
import type { GameState } from '../../GameState';
import type { MapSettings } from '../../mapSettings';
import { getOrSetDefault } from '../../utils';
import { getUnionLeaderId, pointToGeoJSON } from './utils';

export default function processSystemOwnership(
	gameState: GameState,
	settings: MapSettings,
	voronoi: Voronoi<Delaunay.Point>,
	getSystemCoordinates: (id: number, options?: { invertX?: boolean }) => [number, number],
) {
	const fleetToCountry: Record<string, number> = {};
	Object.values(gameState.country).forEach((country) => {
		country.fleets_manager?.owned_fleets.forEach((owned_fleet) => {
			fleetToCountry[owned_fleet.fleet] = country.id;
		});
	});
	const countryToOwnedSystemIds: Record<string, number[]> = {};
	const countryToSystemPolygons: Record<string, Delaunay.Polygon[]> = {};
	const unionLeaderToSystemPolygons: Record<string, Delaunay.Polygon[]> = {};
	const unionLeaderToUnionMembers: Record<number, Set<number>> = {};
	const ownedSystemPoints: helpers.Point[] = [];
	const systemIdToPolygon: Record<string, Delaunay.Polygon> = {};
	const systemIdToCountry: Record<string, number> = {};
	const systemIdToUnionLeader: Record<string, number> = {};
	Object.values(gameState.galactic_object).forEach((go, i) => {
		const starbase =
			go.starbases[0] != null ? gameState.starbase_mgr.starbases[go.starbases[0]] : null;
		const starbaseShip = starbase == null ? null : gameState.ships[starbase.station];
		const ownerId = starbaseShip != null ? fleetToCountry[starbaseShip.fleet] : null;
		const owner = ownerId != null ? gameState.country[ownerId] : null;
		const polygon = voronoi.cellPolygon(i) as Delaunay.Polygon | null;
		if (polygon != null) systemIdToPolygon[go.id] = polygon;
		if (ownerId != null && owner) {
			const joinedUnionLeaderId = getUnionLeaderId(ownerId, gameState, settings, ['joinedBorders']);
			ownedSystemPoints.push(helpers.point(pointToGeoJSON(getSystemCoordinates(go.id))).geometry);
			getOrSetDefault(countryToOwnedSystemIds, ownerId, []).push(go.id);
			systemIdToCountry[go.id] = ownerId;
			systemIdToUnionLeader[go.id] = joinedUnionLeaderId;

			if (polygon == null) {
				console.warn(`null polygon for system at ${getSystemCoordinates(go.id)}`);
			} else {
				getOrSetDefault(countryToSystemPolygons, ownerId, []).push(polygon);
				getOrSetDefault(unionLeaderToSystemPolygons, joinedUnionLeaderId, []).push(polygon);
				getOrSetDefault(unionLeaderToUnionMembers, joinedUnionLeaderId, new Set()).add(ownerId);
			}
		}
	});

	return {
		countryToOwnedSystemIds,
		countryToSystemPolygons,
		unionLeaderToSystemPolygons,
		unionLeaderToUnionMembers,
		ownedSystemPoints,
		systemIdToPolygon,
		systemIdToCountry,
		systemIdToUnionLeader,
	};
}
