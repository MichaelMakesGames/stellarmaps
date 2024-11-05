import * as turf from '@turf/turf';

import {
	getAllPositionArrays,
	type PolygonalFeature,
	type PolygonalFeatureCollection,
} from './utils';

export function getSmoothedPosition(
	position: GeoJSON.Position,
	geoJSON: PolygonalFeatureCollection | PolygonalFeature,
): GeoJSON.Position {
	const ROUND = 2;
	const allPositionArrays = getAllPositionArrays(geoJSON);
	const positionArray = allPositionArrays.find((array) =>
		array.some(
			(p) =>
				turf.round(p[0], ROUND) === turf.round(position[0], ROUND) &&
				turf.round(p[1], ROUND) === turf.round(position[1], ROUND),
		),
	);
	if (positionArray != null && positionArray.length > 0) {
		const positionIndex = positionArray.findIndex(
			(p) =>
				turf.round(p[0], ROUND) === turf.round(position[0], ROUND) &&
				turf.round(p[1], ROUND) === turf.round(position[1], ROUND),
		);

		const nextIndex = (positionIndex + 1) % positionArray.length;
		const next = positionArray[nextIndex] as GeoJSON.Position;
		const nextDx = next[0] - position[0];
		const nextDy = next[1] - position[1];

		const prevIndex = (positionIndex + positionArray.length - 1) % positionArray.length;
		const prev = positionArray[prevIndex] as GeoJSON.Position;
		const prevDx = prev[0] - position[0];
		const prevDy = prev[1] - position[1];

		const smoothedSegment: [GeoJSON.Position, GeoJSON.Position] = [
			[position[0] + prevDx * 0.25, position[1] + prevDy * 0.25],
			[position[0] + nextDx * 0.25, position[1] + nextDy * 0.25],
		];
		const smoothedSegmentMidpoint: GeoJSON.Position = [
			(smoothedSegment[0][0] + smoothedSegment[1][0]) / 2,
			(smoothedSegment[0][1] + smoothedSegment[1][1]) / 2,
		];
		return smoothedSegmentMidpoint;
	} else {
		console.warn('getSmoothedPosition failed: could not find position in geojson');
		return position;
	}
}

function isFeatureCollection(geojson: turf.AllGeoJSON): geojson is GeoJSON.FeatureCollection {
	return geojson.type === 'FeatureCollection';
}
function isFeature(geojson: turf.AllGeoJSON): geojson is GeoJSON.Feature {
	return geojson.type === 'Feature';
}
function isGeometryCollection(geojson: turf.AllGeoJSON): geojson is GeoJSON.GeometryCollection {
	return geojson.type === 'GeometryCollection';
}
function isPoint(geojson: turf.AllGeoJSON): geojson is GeoJSON.Point {
	return geojson.type === 'Point';
}
function isMultiPoint(geojson: turf.AllGeoJSON): geojson is GeoJSON.MultiPoint {
	return geojson.type === 'MultiPoint';
}
function isLineString(geojson: turf.AllGeoJSON): geojson is GeoJSON.LineString {
	return geojson.type === 'LineString';
}
function isMultiLineString(geojson: turf.AllGeoJSON): geojson is GeoJSON.MultiLineString {
	return geojson.type === 'MultiLineString';
}
function isPolygon(geojson: turf.AllGeoJSON): geojson is GeoJSON.Polygon {
	return geojson.type === 'Polygon';
}
function isMultiPolygon(geojson: turf.AllGeoJSON): geojson is GeoJSON.MultiPolygon {
	return geojson.type === 'MultiPolygon';
}
export function smoothGeojson<T extends turf.AllGeoJSON>(geojson: T, iterations: number): T {
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
	positionArray: GeoJSON.Position[],
	iterations: number,
	loops: boolean,
): GeoJSON.Position[] {
	let copy = positionArray.slice();
	for (let i = 0; i < iterations; i++) {
		copy = smoothPositionArrayIteration(copy, loops);
	}
	return copy;
}

function smoothPositionArrayIteration(
	positionArray: GeoJSON.Position[],
	loops: boolean,
): GeoJSON.Position[] {
	const smoothed = positionArray.flatMap((position, index) => {
		const isFirst = index === 0;
		const isLast = index === positionArray.length - 1;
		if ((isFirst || isLast) && !loops) {
			return [position];
		} else {
			const nextIndex = (index + (loops && isLast ? 2 : 1)) % positionArray.length;
			const next = positionArray[nextIndex] as GeoJSON.Position;
			const nextDx = next[0] - position[0];
			const nextDy = next[1] - position[1];

			const prevIndex =
				(index + positionArray.length - (loops && isFirst ? 2 : 1)) % positionArray.length;
			const prev = positionArray[prevIndex] as GeoJSON.Position;
			const prevDx = prev[0] - position[0];
			const prevDy = prev[1] - position[1];

			const smoothedSegment: GeoJSON.Position[] = [
				[position[0] + prevDx * 0.25, position[1] + prevDy * 0.25],
				[position[0] + nextDx * 0.25, position[1] + nextDy * 0.25],
			];
			if (index === positionArray.length - 1) {
				return [smoothedSegment[0] as GeoJSON.Position];
			} else {
				return smoothedSegment;
			}
		}
	});
	return smoothed;
}
