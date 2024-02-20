import * as helpers from '@turf/helpers';
import { Delaunay, Voronoi } from 'd3-delaunay';
import * as topojsonClient from 'topojson-client';
import * as topojsonServer from 'topojson-server';
import * as topojsonSimplify from 'topojson-simplify';
import type { MultiPolygon, Objects, Polygon, Topology } from 'topojson-specification';
import type { GameState } from '../../GameState';
import type { MapSettings } from '../../mapSettings';
import { isDefined } from '../../utils';
import {
	SCALE,
	closeRings,
	getAllPositionArrays,
	pointToGeoJSON,
	type PolygonalFeature,
	type PolygonalGeometry,
} from './utils';

type TopojsonPolygonal = MultiPolygon | Polygon;

export default function processPolygons(
	gameState: GameState,
	settings: MapSettings,
	voronoi: Voronoi<[number, number]>,
	systemIdToVoronoiIndexes: Record<number, number[]>,
	sectorToSystemIds: Record<number, Set<number>>,
	countryToSystemIds: Record<number, Set<number>>,
	unionLeaderToSystemIds: Record<number, Set<number>>,
	knownSystems: Set<number>,
) {
	const systemIdToPolygon: Record<number, PolygonalFeature> = {};
	for (const system of Object.values(gameState.galactic_object)) {
		const delaunayPolygons = (systemIdToVoronoiIndexes[system.id] ?? []).map((voronoiIndex) =>
			voronoi.cellPolygon(voronoiIndex),
		);
		const geojson = joinSystemPolygons(delaunayPolygons);
		if (geojson) {
			systemIdToPolygon[system.id] = geojson;
		}
	}

	const topology = topojsonSimplify.simplify(
		topojsonSimplify.presimplify(
			topojsonServer.topology(systemIdToPolygon) as Topology<Objects<any>>,
		),
		(settings.voronoiGridSize * 2) / SCALE ** 2,
	);

	const countryToGeojson = mergeSystemMappingPolygons(topology, countryToSystemIds);
	const unionLeaderToGeojson = mergeSystemMappingPolygons(topology, unionLeaderToSystemIds);
	const sectorToGeojson = mergeSystemMappingPolygons(topology, sectorToSystemIds);
	const unknownSystemIds = Object.values(gameState.galactic_object)
		.map((s) => s.id)
		.filter((id) => !knownSystems.has(id));
	const terraIncognitaGeojson = mergeSystemPolygons(topology, unknownSystemIds);

	Object.entries(sectorToGeojson).forEach(([sector, geojson]) => closeRings(geojson, { sector }));
	Object.entries(countryToGeojson).forEach(([country, geojson]) =>
		closeRings(geojson, { country }),
	);
	Object.entries(unionLeaderToGeojson).forEach(([unionLeader, geojson]) =>
		closeRings(geojson, { unionLeader }),
	);
	if (terraIncognitaGeojson != null) closeRings(terraIncognitaGeojson, { terraIncognita: true });

	return {
		countryToGeojson,
		unionLeaderToGeojson,
		sectorToGeojson,
		terraIncognitaGeojson,
	};
}

function mergeSystemMappingPolygons(
	topology: Topology<Objects>,
	systemIdMapping: Record<number, Set<number>>,
) {
	return Object.fromEntries(
		Object.entries(systemIdMapping)
			.map(([key, systemIds]) => [key, mergeSystemPolygons(topology, Array.from(systemIds))])
			.filter(([_key, geojson]) => geojson != null),
	) as Record<number, PolygonalFeature>;
}

function mergeSystemPolygons(
	topology: Topology<Objects>,
	systemIds: number[],
): PolygonalFeature | null {
	const geometry = topojsonClient.merge(
		topology,
		systemIds
			.map((systemId) => topology.objects[systemId])
			.filter(
				(object): object is TopojsonPolygonal =>
					object?.type === 'Polygon' || object?.type === 'MultiPolygon',
			),
	) as PolygonalGeometry | null;
	if (geometry == null) return null;
	const feature = helpers.feature(geometry);
	if (getAllPositionArrays(feature).length === 0) return null;
	return feature;
}

function joinSystemPolygons(systemPolygons: (Delaunay.Polygon | null | undefined)[]) {
	const nonNullishPolygons = systemPolygons.filter(isDefined);
	if (!nonNullishPolygons.length) return null;
	const geojsonPolygons = Object.fromEntries(
		nonNullishPolygons.map((points, i) => [i, helpers.polygon([points.map(pointToGeoJSON)])]),
	);
	const topology = topojsonServer.topology(geojsonPolygons) as Topology<Objects<any>>;
	const merged = topojsonClient.merge(
		topology,
		Object.values(topology.objects).filter(
			(o): o is TopojsonPolygonal => o.type === 'Polygon' || o.type === 'MultiPolygon',
		),
	) as PolygonalGeometry | null;
	if (merged == null) return null;

	return helpers.feature(merged);
}
