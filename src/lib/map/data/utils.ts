import type { GameState } from '$lib/GameState';
import type { MapSettings } from '$lib/mapSettings';
import * as helpers from '@turf/helpers';
import intersect from '@turf/intersect';
import union from '@turf/union';
import type { Delaunay } from 'd3-delaunay';
// eslint-disable-next-line
// @ts-ignore
import { pathRound } from 'd3-path';
import { curveBasis, curveBasisClosed, curveLinear, curveLinearClosed } from 'd3-shape';
import { isDefined, parseNumberEntry } from '../../utils';

export const SCALE = 100;

export function pointToGeoJSON([x, y]: [number, number]): [number, number] {
	return [x / SCALE, y / SCALE];
}

export function pointFromGeoJSON(point: helpers.Position): [number, number] {
	return [point[0] * SCALE, point[1] * SCALE];
}

export function inverseX([x, y]: [number, number]): [number, number] {
	return [-x, y];
}

export function getUnionLeaderId(
	countryId: number,
	gameState: GameState,
	settings: MapSettings,
): number {
	const country = gameState.country[countryId];
	const overlordId = country.overlord;
	const overlord = overlordId != null ? gameState.country[overlordId] : null;
	const federation = country.federation != null ? gameState.federation[country.federation] : null;
	const overlordFederation =
		overlord?.federation != null ? gameState.federation[overlord?.federation] : null;
	if (
		settings.unionFederations === 'joinedBorders' &&
		settings.unionSubjects === 'joinedBorders' &&
		overlordFederation
	) {
		return overlordFederation.leader;
	} else if (settings.unionFederations === 'joinedBorders' && federation) {
		return federation.leader;
	} else if (settings.unionSubjects === 'joinedBorders' && overlord && overlordId != null) {
		return overlordId;
	} else {
		return countryId;
	}
}

export function isUnionLeader(countryId: number, gameState: GameState, settings: MapSettings) {
	const country = gameState.country[countryId];
	const federation = country.federation != null ? gameState.federation[country.federation] : null;
	if (settings.unionFederations !== 'off' && settings.unionSubjects !== 'off') {
		if (federation) {
			return federation.leader === countryId;
		} else {
			return Boolean(country.subjects?.length);
		}
	} else if (settings.unionFederations !== 'off' && federation) {
		return federation.leader === countryId;
	} else if (settings.unionSubjects !== 'off') {
		return Boolean(country.subjects?.length);
	} else {
		return false;
	}
}

export function getGameStateValueAsArray<T>(
	value: null | undefined | Record<string, never> | T | T[],
): T[] {
	if (value == null) return [];
	if (Array.isArray(value)) return value;
	if (typeof value === 'object' && Object.keys(value).length === 0) return [];
	return [value as T];
}

export function multiPolygonToPath(
	geoJSON:
		| helpers.FeatureCollection<helpers.MultiPolygon | helpers.Polygon, helpers.Properties>
		| helpers.Feature<helpers.MultiPolygon | helpers.Polygon, helpers.Properties>,
	settings: MapSettings,
) {
	const features = geoJSON.type === 'FeatureCollection' ? geoJSON.features : [geoJSON];
	const coordinates = features.flatMap((feature) =>
		feature.geometry.type === 'MultiPolygon'
			? feature.geometry.coordinates
			: [feature.geometry.coordinates],
	);
	return coordinates
		.flat()
		.map((points) => points.map<[number, number]>(pointFromGeoJSON))
		.map((points) => {
			const pathContext = pathRound(3);
			const curve = settings.borderSmoothing
				? curveBasisClosed(pathContext)
				: curveLinearClosed(pathContext);
			curve.lineStart();
			for (const point of points.map(inverseX)) {
				curve.point(...point);
			}
			curve.lineEnd();
			return pathContext.toString();
		})
		.join(' ');
}

export function segmentToPath(segment: helpers.Position[], settings: MapSettings): string {
	const points = segment.map(pointFromGeoJSON);
	const pathContext = pathRound(3);
	const curve = settings.sectorBorderSmoothing ? curveBasis(pathContext) : curveLinear(pathContext);
	curve.lineStart();
	for (const point of points.map(inverseX)) {
		curve.point(...point);
	}
	curve.lineEnd();
	return pathContext.toString();
}

export function joinSystemPolygons(
	systemPolygons: (Delaunay.Polygon | null | undefined)[],
	galaxyBorderCirclesGeoJSON: null | helpers.Feature<helpers.Polygon | helpers.MultiPolygon>,
) {
	const nonNullishPolygons = systemPolygons.filter(isDefined);
	if (!nonNullishPolygons.length) return null;
	const invalidMultiPolygon = helpers.multiPolygon(
		nonNullishPolygons.map((polygon) => [polygon.map(pointToGeoJSON)]),
	);
	const polygonOrMultiPolygon = union(invalidMultiPolygon, invalidMultiPolygon);
	if (polygonOrMultiPolygon && galaxyBorderCirclesGeoJSON) {
		return intersect(polygonOrMultiPolygon, galaxyBorderCirclesGeoJSON);
	} else {
		return polygonOrMultiPolygon;
	}
}

export function getPolygons(
	geojson:
		| helpers.FeatureCollection<helpers.MultiPolygon | helpers.Polygon>
		| helpers.Feature<helpers.MultiPolygon | helpers.Polygon>,
): helpers.Polygon[] {
	const features = geojson.type === 'FeatureCollection' ? geojson.features : [geojson];
	return features.flatMap((feature) => {
		if (feature.geometry.type === 'Polygon') {
			return [feature.geometry];
		} else {
			return feature.geometry.coordinates.map((coords) => helpers.polygon(coords).geometry);
		}
	});
}

export function getCountryColors(countryId: number, gameState: GameState, settings: MapSettings) {
	const country = gameState.country[countryId];
	const overlordId = country.overlord;
	const overlord = overlordId != null ? gameState.country[overlordId] : null;
	const federation = country.federation != null ? gameState.federation[country.federation] : null;
	const overlordFederation =
		overlord?.federation != null ? gameState.federation[overlord?.federation] : null;
	if (
		settings.unionFederations !== 'off' &&
		settings.unionSubjects !== 'off' &&
		overlordFederation
	) {
		return gameState.country[overlordFederation.leader].flag?.colors;
	} else if (settings.unionFederations !== 'off' && federation) {
		return gameState.country[federation.leader].flag?.colors;
	} else if (settings.unionSubjects !== 'off' && overlord) {
		return overlord.flag?.colors;
	} else {
		return country.flag?.colors;
	}
}

export function positionToString(p: helpers.Position): string {
	return `${p[0].toFixed(3)},${p[1].toFixed(3)}`;
}

export function getAllPositionArrays(
	geoJSON:
		| helpers.FeatureCollection<helpers.Polygon | helpers.MultiPolygon>
		| helpers.Feature<helpers.Polygon | helpers.MultiPolygon>,
) {
	const features = geoJSON.type === 'FeatureCollection' ? geoJSON.features : [geoJSON];
	const allPositionArrays = features
		.map<helpers.Position[][]>((f) => {
			const geometry = f.geometry;
			if (geometry.type === 'Polygon') {
				return geometry.coordinates;
			} else {
				return geometry.coordinates.flat();
			}
		})
		.flat();
	return allPositionArrays;
}

export function createHyperlanePaths(
	gameState: GameState,
	relayMegastructures: Set<number>,
	systemIdToUnionLeader: Record<number, number | undefined>,
	owner: null | number,
) {
	const hyperlanes = new Set<string>();
	const relayHyperlanes = new Set<string>();
	Object.entries(gameState.galactic_object)
		.map(parseNumberEntry)
		.forEach(([goId, go]) => {
			for (const hyperlane of getGameStateValueAsArray(go.hyperlane).filter((lane) => {
				if (owner != null) {
					return systemIdToUnionLeader[goId] === owner && systemIdToUnionLeader[lane.to] === owner;
				} else {
					return (
						systemIdToUnionLeader[goId] == null ||
						systemIdToUnionLeader[lane.to] == null ||
						systemIdToUnionLeader[goId] !== systemIdToUnionLeader[lane.to]
					);
				}
			})) {
				const isRelay =
					go.megastructures?.some((id) => relayMegastructures.has(id)) &&
					gameState.galactic_object[hyperlane.to].megastructures?.some((id) =>
						relayMegastructures.has(id),
					);
				const key = [goId, hyperlane.to].sort().join(',');
				if (isRelay) {
					relayHyperlanes.add(key);
				} else {
					hyperlanes.add(key);
				}
			}
		});
	const hyperlanesPath = Array.from(hyperlanes.values())
		.map((key) => {
			const [a, b] = key.split(',').map((id) => gameState.galactic_object[parseInt(id)]);
			return `M ${-a.coordinate.x} ${a.coordinate.y} L ${-b.coordinate.x} ${b.coordinate.y}`;
		})
		.join(' ');
	const relayHyperlanesPath = Array.from(relayHyperlanes.values())
		.map((key) => {
			const [a, b] = key.split(',').map((id) => gameState.galactic_object[parseInt(id)]);
			return `M ${-a.coordinate.x} ${a.coordinate.y} L ${-b.coordinate.x} ${b.coordinate.y}`;
		})
		.join(' ');
	return { hyperlanesPath, relayHyperlanesPath };
}
