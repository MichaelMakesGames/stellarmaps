/* eslint-disable @typescript-eslint/no-unnecessary-condition */
// TODO re-enable the above rule and update db to Record<number, T | undefined>
import type { GameState } from '../../GameState';
import type { MapSettings } from '../../mapSettings';
import type { Delaunay, Voronoi } from 'd3-delaunay';
import { getUnionLeaderId, pointToGeoJSON } from './utils';
import * as helpers from '@turf/helpers';

export default function processSystemOwnership(
	gameState: GameState,
	settings: MapSettings,
	voronoi: Voronoi<Delaunay.Point>,
	systemIdToCoordinates: Record<number, [number, number]>,
) {
	const fleetToCountry: Record<string, number> = {};
	Object.values(gameState.country).forEach((country) => {
		country.fleets_manager?.owned_fleets?.forEach((owned_fleet) => {
			fleetToCountry[owned_fleet.fleet] = country.id;
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
	Object.values(gameState.galactic_object).forEach((go, i) => {
		const starbase = gameState.starbase_mgr.starbases[go.starbases[0]];
		const ownerId =
			starbase != null ? fleetToCountry[gameState.ships[starbase.station].fleet] : null;
		const owner = ownerId != null ? gameState.country[ownerId] : null;
		const polygon = voronoi.cellPolygon(i);
		systemIdToPolygon[go.id] = polygon;
		if (ownerId != null && owner) {
			const joinedUnionLeaderId = getUnionLeaderId(ownerId, gameState, settings, ['joinedBorders']);
			ownedSystemPoints.push(helpers.point(pointToGeoJSON(systemIdToCoordinates[go.id])).geometry);
			if (countryToOwnedSystemIds[ownerId] == null) {
				countryToOwnedSystemIds[ownerId] = [];
			}
			countryToOwnedSystemIds[ownerId].push(go.id);
			systemIdToCountry[go.id] = ownerId;
			systemIdToUnionLeader[go.id] = joinedUnionLeaderId;

			if (polygon == null) {
				console.warn(`null polygon for system at ${systemIdToCoordinates[go.id]}`);
			} else {
				if (countryToSystemPolygons[ownerId] == null) {
					countryToSystemPolygons[ownerId] = [];
				}
				countryToSystemPolygons[ownerId].push(polygon);
				if (unionLeaderToSystemPolygons[joinedUnionLeaderId] == null) {
					unionLeaderToSystemPolygons[joinedUnionLeaderId] = [];
				}
				unionLeaderToSystemPolygons[joinedUnionLeaderId].push(polygon);
				if (unionLeaderToUnionMembers[joinedUnionLeaderId] == null) {
					unionLeaderToUnionMembers[joinedUnionLeaderId] = new Set();
				}
				unionLeaderToUnionMembers[joinedUnionLeaderId].add(ownerId);
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
