import * as helpers from '@turf/helpers';
import {
	getAllPositionArrays,
	type PolygonalFeature,
	type PolygonalFeatureCollection,
} from './utils';

export function getSmoothedPosition(
	position: helpers.Position,
	geoJSON: PolygonalFeatureCollection | PolygonalFeature,
): helpers.Position {
	const ROUND = 2;
	const allPositionArrays = getAllPositionArrays(geoJSON);
	const positionArray = allPositionArrays.find((array) =>
		array.some(
			(p) =>
				helpers.round(p[0], ROUND) === helpers.round(position[0], ROUND) &&
				helpers.round(p[1], ROUND) === helpers.round(position[1], ROUND),
		),
	);
	if (positionArray != null && positionArray.length > 0) {
		const positionIndex = positionArray.findIndex(
			(p) =>
				helpers.round(p[0], ROUND) === helpers.round(position[0], ROUND) &&
				helpers.round(p[1], ROUND) === helpers.round(position[1], ROUND),
		);

		const nextIndex = (positionIndex + 1) % positionArray.length;
		const next = positionArray[nextIndex] as helpers.Position;
		const nextDx = next[0] - position[0];
		const nextDy = next[1] - position[1];

		const prevIndex = (positionIndex + positionArray.length - 1) % positionArray.length;
		const prev = positionArray[prevIndex] as helpers.Position;
		const prevDx = prev[0] - position[0];
		const prevDy = prev[1] - position[1];

		const smoothedSegment: [helpers.Position, helpers.Position] = [
			[position[0] + prevDx * 0.25, position[1] + prevDy * 0.25],
			[position[0] + nextDx * 0.25, position[1] + nextDy * 0.25],
		];
		const smoothedSegmentMidpoint: helpers.Position = [
			(smoothedSegment[0][0] + smoothedSegment[1][0]) / 2,
			(smoothedSegment[0][1] + smoothedSegment[1][1]) / 2,
		];
		return smoothedSegmentMidpoint;
	} else {
		console.warn('getSmoothedPosition failed: could not find position in geojson');
		return position;
	}
}

function isFeatureCollection(geojson: helpers.AllGeoJSON): geojson is helpers.FeatureCollection {
	return geojson.type === 'FeatureCollection';
}
function isFeature(geojson: helpers.AllGeoJSON): geojson is helpers.Feature {
	return geojson.type === 'Feature';
}
function isGeometryCollection(geojson: helpers.AllGeoJSON): geojson is helpers.GeometryCollection {
	return geojson.type === 'GeometryCollection';
}
function isPoint(geojson: helpers.AllGeoJSON): geojson is helpers.Point {
	return geojson.type === 'Point';
}
function isMultiPoint(geojson: helpers.AllGeoJSON): geojson is helpers.MultiPoint {
	return geojson.type === 'MultiPoint';
}
function isLineString(geojson: helpers.AllGeoJSON): geojson is helpers.LineString {
	return geojson.type === 'LineString';
}
function isMultiLineString(geojson: helpers.AllGeoJSON): geojson is helpers.MultiLineString {
	return geojson.type === 'MultiLineString';
}
function isPolygon(geojson: helpers.AllGeoJSON): geojson is helpers.Polygon {
	return geojson.type === 'Polygon';
}
function isMultiPolygon(geojson: helpers.AllGeoJSON): geojson is helpers.MultiPolygon {
	return geojson.type === 'MultiPolygon';
}
export function smoothGeojson<T extends helpers.AllGeoJSON>(geojson: T, iterations: number): T {
	if (isFeatureCollection(geojson)) {
		return {
			...geojson,
			features: geojson.features.map((f) => smoothGeojson(f, iterations)),
		};
	} else if (isFeature(geojson)) {
		return {
			...geojson,
			geometry: smoothGeojson(geojson.geometry, iterations),
		};
	} else if (isGeometryCollection(geojson)) {
		return {
			...geojson,
			geometries: geojson.geometries.map((g) => smoothGeojson(g, iterations)),
		};
	} else if (isPoint(geojson) || isMultiPoint(geojson)) {
		return geojson;
	} else if (isLineString(geojson)) {
		return {
			...geojson,
			coordinates: smoothPositionArray(geojson.coordinates, iterations, false),
		};
	} else if (isMultiLineString(geojson)) {
		return {
			...geojson,
			coordinates: geojson.coordinates.map((lineString) =>
				smoothPositionArray(lineString, iterations, false),
			),
		};
	} else if (isPolygon(geojson)) {
		return {
			...geojson,
			coordinates: geojson.coordinates.map((ring) => smoothPositionArray(ring, iterations, true)),
		};
	} else if (isMultiPolygon(geojson)) {
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
			const next = positionArray[nextIndex] as helpers.Position;
			const nextDx = next[0] - position[0];
			const nextDy = next[1] - position[1];

			const prevIndex =
				(index + positionArray.length - (loops && isFirst ? 2 : 1)) % positionArray.length;
			const prev = positionArray[prevIndex] as helpers.Position;
			const prevDx = prev[0] - position[0];
			const prevDy = prev[1] - position[1];

			const smoothedSegment: helpers.Position[] = [
				[position[0] + prevDx * 0.25, position[1] + prevDy * 0.25],
				[position[0] + nextDx * 0.25, position[1] + nextDy * 0.25],
			];
			if (index === positionArray.length - 1) {
				return [smoothedSegment[0] as helpers.Position];
			} else {
				return smoothedSegment;
			}
		}
	});
	return smoothed;
}
