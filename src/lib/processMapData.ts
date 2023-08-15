import * as helpers from '@turf/helpers';
import union from '@turf/union';
import { Delaunay } from 'd3-delaunay';
import { path as d3Path } from 'd3-path';
import { curveBasisClosed } from 'd3-shape';
import type { GameState } from './GameState';

export default function processMapData(gameState: GameState) {
	console.time('generating voronoi');
	const points = Object.values(gameState.galactic_object).map<[number, number]>((go) => [
		go.coordinate.x,
		go.coordinate.y
	]);
	const minDistanceSquared = 35 ** 2;
	const extraPoints: [number, number][] = [];
	for (let x = -500; x <= 500; x += 5) {
		for (let y = -500; y <= 500; y += 5) {
			if (
				points.some(
					([otherX, otherY]) => (otherX - x) ** 2 + (otherY - y) ** 2 < minDistanceSquared
				)
			) {
				// do nothing
			} else {
				extraPoints.push([x, y]);
			}
		}
	}
	points.push(...extraPoints);
	const delaunay = Delaunay.from(points);
	const voronoi = delaunay.voronoi([-500, -500, 500, 500]);
	console.timeEnd('generating voronoi');

	console.time('processing');
	const fleetToCountry: Record<string, number> = {};
	Object.entries(gameState.country).forEach(([countryId, country]) => {
		country.fleets_manager?.owned_fleets?.forEach((owned_fleet) => {
			fleetToCountry[owned_fleet.fleet] = parseFloat(countryId);
		});
	});
	const countryToSystemPolygon: Record<string, Delaunay.Polygon[]> = {};
	Object.values(gameState?.galactic_object ?? {}).forEach((go, i) => {
		const starbase = gameState.starbase_mgr.starbases[go.starbases[0]];
		const ownerId = starbase ? fleetToCountry[gameState.ships[starbase.station].fleet] : null;
		const owner = ownerId != null ? gameState.country[ownerId] : null;
		if (ownerId != null && owner) {
			const polygon = voronoi.cellPolygon(i);
			if (!countryToSystemPolygon[ownerId]) {
				countryToSystemPolygon[ownerId] = [];
			}
			countryToSystemPolygon[ownerId].push(polygon);
		}
	});
	const borders = Object.entries(countryToSystemPolygon).map(([countryId, polygons]) => {
		const country = gameState.country[parseInt(countryId)];
		const color = country.flag.colors.find((c) => c !== 'black' && c !== 'null') ?? 'black';
		if (color === 'black') console.warn('black country?', country);
		const primaryColor = country.flag.colors[0];
		const secondaryColor = country.flag.colors[1];
		if (polygons.length > 1) {
			const unioned = union(
				helpers.polygon([polygons[0].map((point) => [point[0] / 10, point[1] / 10])]),
				helpers.multiPolygon(
					polygons
						.slice(1)
						.map((polygon) => [polygon.map((point) => [point[0] / 10, point[1] / 10])])
				)
			);
			if (unioned) {
				const coordinates =
					unioned.geometry.type === 'Polygon'
						? [unioned.geometry.coordinates]
						: unioned.geometry.coordinates;
				const path = coordinates
					.flat()
					.map((points) => points.map<[number, number]>((point) => [point[0] * 10, point[1] * 10]))
					.map((points) => {
						const pathContext = d3Path();
						const curve = curveBasisClosed(pathContext);
						curve.lineStart();
						for (const point of points) {
							curve.point(-point[0], point[1]);
						}
						curve.lineEnd();
						return pathContext.toString();
					})
					.join(' ');
				return { primaryColor, secondaryColor, path };
			} else {
				return { primaryColor, secondaryColor, path: '' };
			}
		} else {
			const pathContext = d3Path();
			const curve = curveBasisClosed(pathContext);
			curve.lineStart();
			for (const point of polygons[0]) {
				curve.point(-point[0], point[1]);
			}
			curve.lineEnd();
			const path = pathContext.toString();
			return { path, primaryColor, secondaryColor };
		}
	});
	console.timeEnd('processing');

	return { borders };
}
