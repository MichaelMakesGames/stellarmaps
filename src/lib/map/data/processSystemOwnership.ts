import type { GameState } from '$lib/GameState';
import type { MapSettings } from '$lib/mapSettings';
import type { Delaunay, Voronoi } from 'd3-delaunay';
import { getUnionLeaderId, pointToGeoJSON } from './utils';
import * as helpers from '@turf/helpers';
import { parseNumberEntry } from '$lib/utils';

export default function processSystemOwnership(
	gameState: GameState,
	settings: MapSettings,
	voronoi: Voronoi<Delaunay.Point>,
	systemIdToCoordinates: Record<number, [number, number]>,
) {
	const fleetToCountry: Record<string, number> = {};
	Object.entries(gameState.country).forEach(([countryId, country]) => {
		country.fleets_manager?.owned_fleets?.forEach((owned_fleet) => {
			fleetToCountry[owned_fleet.fleet] = parseFloat(countryId);
		});
	});
	const countryToOwnedSystemIds: Record<string, number[]> = {};
	const countryToSystemPolygons: Record<string, Delaunay.Polygon[]> = {};
	const unionLeaderToSystemPolygons: Record<string, Delaunay.Polygon[]> = {};
	const unionLeaderToUnionMembers: Record<number, Set<number>> = {};
	const ownedSystemPoints: helpers.Point[] = [];
	const systemIdToPolygon: Record<string, Delaunay.Polygon> = {};
	const systemIdToCountry: Record<string, number | undefined> = {};
	const systemIdToUnionLeader: Record<string, number | undefined> = {};
	Object.entries(gameState?.galactic_object ?? {})
		.map(parseNumberEntry)
		.forEach(([goId, go], i) => {
			const starbase = gameState.starbase_mgr.starbases[go.starbases[0]];
			const ownerId = starbase ? fleetToCountry[gameState.ships[starbase.station].fleet] : null;
			const owner = ownerId != null ? gameState.country[ownerId] : null;
			const polygon = voronoi.cellPolygon(i);
			systemIdToPolygon[goId] = polygon;
			if (ownerId != null && owner) {
				const unionLeaderId = getUnionLeaderId(ownerId, gameState, settings);
				ownedSystemPoints.push(helpers.point(pointToGeoJSON(systemIdToCoordinates[goId])).geometry);
				if (!countryToOwnedSystemIds[ownerId]) {
					countryToOwnedSystemIds[ownerId] = [];
				}
				countryToOwnedSystemIds[ownerId].push(goId);
				systemIdToCountry[goId] = ownerId;
				systemIdToUnionLeader[goId] = unionLeaderId;

				if (polygon == null) {
					console.warn(`null polygon for system at ${systemIdToCoordinates[goId]}`);
				} else {
					if (!countryToSystemPolygons[ownerId]) {
						countryToSystemPolygons[ownerId] = [];
					}
					countryToSystemPolygons[ownerId].push(polygon);
					if (!unionLeaderToSystemPolygons[unionLeaderId]) {
						unionLeaderToSystemPolygons[unionLeaderId] = [];
					}
					unionLeaderToSystemPolygons[unionLeaderId].push(polygon);
					if (!unionLeaderToUnionMembers[unionLeaderId]) {
						unionLeaderToUnionMembers[unionLeaderId] = new Set();
					}
					unionLeaderToUnionMembers[unionLeaderId].add(ownerId);
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
