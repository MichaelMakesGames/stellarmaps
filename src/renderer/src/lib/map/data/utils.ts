import type { GameState } from '../../GameState';
import type { MapSettings } from '../../mapSettings';
import * as helpers from '@turf/helpers';
import intersect from '@turf/intersect';
import union from '@turf/union';
import type { Delaunay } from 'd3-delaunay';
// eslint-disable-next-line
// @ts-ignore
import { pathRound } from 'd3-path';
import { curveBasis, curveBasisClosed, curveLinear, curveLinearClosed } from 'd3-shape';
import { isDefined } from '../../utils';
import explode from '@turf/explode';

export const SCALE = 100;

export function pointToGeoJSON([x, y]: [number, number]): [number, number] {
	return [x / SCALE, y / SCALE];
}

export function pointFromGeoJSON(point: helpers.Position): [number, number] {
	return [point[0] * SCALE, point[1] * SCALE];
}

export function round3Position(position: [number, number]): [number, number] {
	return [helpers.round(position[0], 3), helpers.round(position[1], 3)];
}

export function inverseX([x, y]: [number, number]): [number, number] {
	return [-x, y];
}

export function getUnionLeaderId(
	countryId: number,
	gameState: GameState,
	settings: MapSettings,
	values: ('joinedBorders' | 'separateBorders' | 'off')[],
): number {
	const isIncludedValue = (value: string) => (values as string[]).includes(value);
	const country = gameState.country[countryId];
	if (country == null) return countryId;
	const overlordId = country.overlord;
	const overlord = overlordId != null ? gameState.country[overlordId] : null;
	const federation = country.federation != null ? gameState.federation[country.federation] : null;
	const overlordFederation =
		overlord?.federation != null ? gameState.federation[overlord.federation] : null;
	if (!settings.unionMode) {
		return countryId;
	} else if (
		isIncludedValue(settings.unionFederations) &&
		isIncludedValue(settings.unionSubjects) &&
		overlordFederation
	) {
		return settings.unionFederationsColor === 'leader'
			? overlordFederation.leader
			: overlordFederation.members[0] ?? countryId;
	} else if (isIncludedValue(settings.unionFederations) && federation) {
		return settings.unionFederationsColor === 'leader'
			? federation.leader
			: federation.members[0] ?? countryId;
	} else if (isIncludedValue(settings.unionSubjects) && overlord && overlordId != null) {
		return overlordId;
	} else {
		return countryId;
	}
}

export function isUnionLeader(countryId: number, gameState: GameState, settings: MapSettings) {
	const country = gameState.country[countryId];
	if (country == null) return false;
	const federation = country.federation != null ? gameState.federation[country.federation] : null;
	if (!settings.unionMode) {
		return false;
	} else if (settings.unionFederations !== 'off' && settings.unionSubjects !== 'off') {
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

export function multiPolygonToPath(
	geoJSON:
		| helpers.FeatureCollection<helpers.MultiPolygon | helpers.Polygon, helpers.Properties>
		| helpers.Feature<helpers.MultiPolygon | helpers.Polygon, helpers.Properties>,
	smooth: boolean,
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
			const curve = smooth ? curveBasisClosed(pathContext) : curveLinearClosed(pathContext);
			curve.lineStart();
			for (const point of points.map(inverseX)) {
				curve.point(...point);
			}
			curve.lineEnd();
			return pathContext.toString();
		})
		.join(' ');
}

export function segmentToPath(segment: helpers.Position[], smooth: boolean): string {
	const points = segment.map(pointFromGeoJSON);
	const pathContext = pathRound(3);
	const curve = smooth ? curveBasis(pathContext) : curveLinear(pathContext);
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
	const allPositions: Record<string, helpers.Position> = {};
	const invalidMultiPolygon = helpers.multiPolygon(
		nonNullishPolygons.map((polygon) => {
			const ring = polygon.map((point) => {
				const position = round3Position(pointToGeoJSON(point));
				allPositions[positionToString(position)] = position;
				return position;
			});
			if (ring[0] != null) {
				// should always be true
				ring[ring.length - 1] = ring[0];
			}
			return [ring];
		}),
	);
	const polygonOrMultiPolygon = union(invalidMultiPolygon, invalidMultiPolygon);
	const externalPositionStrings = new Set(
		(polygonOrMultiPolygon
			? explode(polygonOrMultiPolygon).features.map((f) => f.geometry.coordinates)
			: []
		).map(positionToString),
	);
	const internalPositions = Object.values(allPositions).filter(
		(p) => !externalPositionStrings.has(positionToString(p)),
	);
	if (polygonOrMultiPolygon && galaxyBorderCirclesGeoJSON) {
		return insertRedundantPositions(
			intersect(polygonOrMultiPolygon, galaxyBorderCirclesGeoJSON),
			internalPositions,
		);
	} else {
		return insertRedundantPositions(polygonOrMultiPolygon, internalPositions);
	}
}

function insertRedundantPositions(
	geojson: null | helpers.Feature<helpers.MultiPolygon | helpers.Polygon>,
	positions: helpers.Position[],
) {
	if (geojson == null) return null;
	getAllPositionArrays(geojson).forEach((positionArray) => {
		for (let i = 0; i < positionArray.length - 1; i++) {
			const pos = positionArray[i] as helpers.Position;
			const nextPos = positionArray[i + 1] as helpers.Position;
			const maxX = Math.max(pos[0], nextPos[0]);
			const minX = Math.min(pos[0], nextPos[0]);
			const maxY = Math.max(pos[1], nextPos[1]);
			const minY = Math.min(pos[1], nextPos[1]);
			const slope = helpers.round((nextPos[0] - pos[0]) / (nextPos[1] - pos[1]), 3);
			const positionsToInsert = positions.filter((posToInsert) => {
				return (
					posToInsert[0] >= minX &&
					posToInsert[0] <= maxX &&
					posToInsert[1] >= minY &&
					posToInsert[1] <= maxY &&
					helpers.round((nextPos[0] - posToInsert[0]) / (nextPos[1] - posToInsert[1]), 3) === slope
				);
			});
			positionsToInsert.sort((a, b) => {
				const aDistToNextPosSquared = (a[0] - nextPos[0]) ** 2 + (a[1] - nextPos[1]) ** 2;
				const bDistToNextPosSquared = (b[0] - nextPos[0]) ** 2 + (b[1] - nextPos[1]) ** 2;
				return bDistToNextPosSquared - aDistToNextPosSquared;
			});
			positionArray.splice(i + 1, 0, ...positionsToInsert);
			i += positionsToInsert.length;
		}
	});
	return geojson;
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
	return gameState.country[
		getUnionLeaderId(countryId, gameState, settings, ['joinedBorders', 'separateBorders'])
	]?.flag?.colors;
}

export function positionToString(p: helpers.Position): string {
	return `${p[0].toFixed(2)},${p[1].toFixed(2)}`;
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
	settings: MapSettings,
	relayMegastructures: Set<number>,
	systemIdToUnionLeader: Record<number, number>,
	owner: null | number,
	getSystemCoordinates: (id: number, options?: { invertX?: boolean }) => [number, number],
) {
	const hyperlanes = new Set<string>();
	const relayHyperlanes = new Set<string>();
	Object.values(gameState.galactic_object).forEach((go) => {
		for (const hyperlane of (go.hyperlane ?? []).filter((lane) => {
			if (owner != null) {
				return systemIdToUnionLeader[go.id] === owner && systemIdToUnionLeader[lane.to] === owner;
			} else {
				return (
					systemIdToUnionLeader[go.id] == null ||
					systemIdToUnionLeader[lane.to] == null ||
					systemIdToUnionLeader[go.id] !== systemIdToUnionLeader[lane.to]
				);
			}
		})) {
			const isRelay =
				go.megastructures?.some((id) => relayMegastructures.has(id)) &&
				gameState.galactic_object[hyperlane.to]?.megastructures?.some((id) =>
					relayMegastructures.has(id),
				);
			const key = [go.id, hyperlane.to].sort().join(',');
			if (isRelay) {
				relayHyperlanes.add(key);
			} else {
				hyperlanes.add(key);
			}
		}
	});

	const RADIUS = 3;
	const RADIUS_45 = Math.sqrt(RADIUS ** 2 / 2);
	const makeHyperlanePath = (key: string) => {
		const [a, b] = key.split(',').map((id) => getSystemCoordinates(parseInt(id)));
		if (a == null || b == null)
			throw new Error(`Failed to parse system ids from hyperlane key ${key}`);
		const simplePath = `M ${-a[0]} ${a[1]} L ${-b[0]} ${b[1]}`;
		const dx = b[0] - a[0];
		const dy = b[1] - a[1];
		const dxSign = dx > 0 ? -1 : 1;
		const dySign = dy > 0 ? 1 : -1;
		if (
			!settings.hyperlaneMetroStyle ||
			Math.abs(dx) < 1 ||
			Math.abs(dy) < 1 ||
			Math.abs(helpers.round(dx / dy, 1)) === 1
		) {
			return simplePath;
		} else {
			if (
				Math.abs(dx) > Math.abs(dy) &&
				Math.abs(dx) > RADIUS + RADIUS_45 &&
				Math.abs(dy) > RADIUS
			) {
				return [
					`M ${-a[0]} ${a[1]}`,
					`h ${dxSign * (Math.abs(dx) - Math.abs(dy) - RADIUS)}`,
					`q ${dxSign * RADIUS} 0 ${dxSign * (RADIUS + RADIUS_45)} ${dySign * RADIUS_45}`,
					`L ${-b[0]} ${b[1]}`,
				].join(' ');
			} else if (
				Math.abs(dy) > Math.abs(dx) &&
				Math.abs(dy) > RADIUS + RADIUS_45 &&
				Math.abs(dx) > RADIUS
			) {
				return [
					`M ${-a[0]} ${a[1]}`,
					`v ${dySign * (Math.abs(dy) - Math.abs(dx) - RADIUS)}`,
					`q 0 ${dySign * RADIUS} ${dxSign * RADIUS_45} ${dySign * (RADIUS_45 + RADIUS)}`,
					`L ${-b[0]} ${b[1]}`,
				].join(' ');
			} else {
				return simplePath;
			}
		}
	};

	const hyperlanesPath = Array.from(hyperlanes.values()).map(makeHyperlanePath).join(' ');
	const relayHyperlanesPath = Array.from(relayHyperlanes.values()).map(makeHyperlanePath).join(' ');
	return { hyperlanesPath, relayHyperlanesPath };
}
