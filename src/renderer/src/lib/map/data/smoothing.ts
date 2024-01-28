import type * as helpers from '@turf/helpers';
import { getAllPositionArrays } from './utils';

export function getSmoothedPosition(
	position: helpers.Position,
	geoJSON:
		| helpers.FeatureCollection<helpers.Polygon | helpers.MultiPolygon>
		| helpers.Feature<helpers.Polygon | helpers.MultiPolygon>,
) {
	const allPositionArrays = getAllPositionArrays(geoJSON);
	const positionArray = allPositionArrays.find((array) =>
		array.some((p) => p[0] === position[0] && p[1] === position[1]),
	);
	if (positionArray) {
		const positionIndex = positionArray.findIndex(
			(p) => p[0] === position[0] && p[1] === position[1],
		);

		const nextIndex = (positionIndex + 1) % positionArray.length;
		const next = positionArray[nextIndex];
		const nextDx = next[0] - position[0];
		const nextDy = next[1] - position[1];

		const prevIndex = (positionIndex + positionArray.length - 1) % positionArray.length;
		const prev = positionArray[prevIndex];
		const prevDx = prev[0] - position[0];
		const prevDy = prev[1] - position[1];

		const smoothedSegment = [
			[position[0] + prevDx * 0.25, position[1] + prevDy * 0.25],
			[position[0] + nextDx * 0.25, position[1] + nextDy * 0.25],
		];
		const smoothedSegmentMidpoint = [
			(smoothedSegment[0][0] + smoothedSegment[1][0]) / 2,
			(smoothedSegment[0][1] + smoothedSegment[1][1]) / 2,
		];
		return smoothedSegmentMidpoint;
	} else {
		console.warn('getSmoothedPosition failed: could not find position in geojson');
		return position;
	}
}

export function smoothGeojson<T extends GeoJSON.GeoJSON>(geojson: T, iterations: number): T {
	if (geojson.type === 'FeatureCollection') {
		return {
			...geojson,
			features: geojson.features.map((f) => smoothGeojson(f, iterations)),
		};
	} else if (geojson.type === 'Feature') {
		return {
			...geojson,
			geometry: smoothGeojson(geojson.geometry, iterations),
		};
	} else if (geojson.type === 'GeometryCollection') {
		return {
			...geojson,
			geometries: geojson.geometries.map((g) => smoothGeojson(g, iterations)),
		};
	} else if (geojson.type === 'Point' || geojson.type === 'MultiPoint') {
		return geojson;
	} else if (geojson.type === 'LineString') {
		return {
			...geojson,
			coordinates: smoothPositionArray(geojson.coordinates, iterations, false),
		};
	} else if (geojson.type === 'MultiLineString') {
		return {
			...geojson,
			coordinates: geojson.coordinates.map((lineString) =>
				smoothPositionArray(lineString, iterations, false),
			),
		};
	} else if (geojson.type === 'Polygon') {
		return {
			...geojson,
			coordinates: geojson.coordinates.map((ring) => smoothPositionArray(ring, iterations, true)),
		};
	} else if (geojson.type === 'MultiPolygon') {
		return {
			...geojson,
			coordinates: geojson.coordinates.map((polygon) =>
				polygon.map((ring) => smoothPositionArray(ring, iterations, true)),
			),
		};
	}
	return geojson;
}

function smoothPositionArray(
	positionArray: helpers.Position[],
	iterations: number,
	loops: boolean,
): helpers.Position[] {
	let copy = positionArray.slice();
	for (let i = 0; i < iterations; i++) {
		copy = smoothPositionArrayIteration(copy, loops);
	}
	return copy;
}

function smoothPositionArrayIteration(
	positionArray: helpers.Position[],
	loops: boolean,
): helpers.Position[] {
	const smoothed = positionArray.flatMap((position, index) => {
		const isFirst = index === 0;
		const isLast = index === positionArray.length - 1;
		if ((isFirst || isLast) && !loops) {
			return [position];
		} else {
			const nextIndex = (index + (loops && isLast ? 2 : 1)) % positionArray.length;
			const next = positionArray[nextIndex];
			const nextDx = next[0] - position[0];
			const nextDy = next[1] - position[1];

			const prevIndex =
				(index + positionArray.length - (loops && isFirst ? 2 : 1)) % positionArray.length;
			const prev = positionArray[prevIndex];
			const prevDx = prev[0] - position[0];
			const prevDy = prev[1] - position[1];

			const smoothedSegment: helpers.Position[] = [
				[position[0] + prevDx * 0.25, position[1] + prevDy * 0.25],
				[position[0] + nextDx * 0.25, position[1] + nextDy * 0.25],
			];
			if (index === positionArray.length - 1) {
				return [smoothedSegment[0]];
			} else {
				return smoothedSegment;
			}
		}
	});
	return smoothed;
}
