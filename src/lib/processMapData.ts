import buffer from '@turf/buffer';
import union from '@turf/union';
import polygonSmooth from '@turf/polygon-smooth';
import * as helpers from '@turf/helpers';
import { Delaunay } from 'd3-delaunay';
// eslint-disable-next-line
// @ts-ignore
import { pathRound } from 'd3-path';
import { curveBasisClosed, curveLinearClosed } from 'd3-shape';
import type { Bypass, GameState } from './GameState';
import type { MapSettings } from './mapSettings';

const SCALE = 100;

export default function processMapData(gameState: GameState, settings: MapSettings) {
	console.time('generating voronoi');
	const points = Object.values(gameState.galactic_object).map<[number, number]>((go) => [
		go.coordinate.x,
		go.coordinate.y
	]);
	const minDistanceSquared = 35 ** 2;
	const extraPoints: [number, number][] = [];
	for (let x = -500; x <= 500; x += 10) {
		for (let y = -500; y <= 500; y += 10) {
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
		const primaryColor = country.flag.colors[0];
		const secondaryColor = country.flag.colors[1];
		const multiPolygon = helpers.multiPolygon(
			polygons.map((polygon) => [polygon.map((point) => [point[0] / SCALE, point[1] / SCALE])])
		);
		let outer = helpers.featureCollection([
			union(multiPolygon, multiPolygon) as helpers.Feature<helpers.MultiPolygon | helpers.Polygon>
		]);
		if (settings.borderSmoothing) {
			outer = polygonSmooth(
				union(multiPolygon, multiPolygon) as helpers.Feature<
					helpers.MultiPolygon | helpers.Polygon
				>,
				{ iterations: 2 }
			);
		}
		const inner = buffer(outer, -settings.borderWidth, { units: 'miles' });
		const outerPath = multiPolygonToPath(outer, settings);
		const innerPath = multiPolygonToPath(inner, settings);
		return { primaryColor, secondaryColor, outerPath, innerPath };
	});

	const relayMegastructures = new Set(
		Object.values(gameState.bypasses)
			.filter(
				(bypass): bypass is Bypass & Required<Pick<Bypass, 'owner'>> =>
					bypass.type === 'relay_bypass' && bypass.owner?.type === 6
			)
			.map((bypass) => bypass.owner.id)
	);
	const hyperlanes = new Set<string>();
	const relayHyperlanes = new Set<string>();
	Object.entries(gameState.galactic_object).forEach(([goId, go]) => {
		for (const hyperlane of go.hyperlane ?? []) {
			const isRelay =
				go.megastructures?.some((id) => relayMegastructures.has(id)) &&
				gameState.galactic_object[hyperlane.to].megastructures?.some((id) =>
					relayMegastructures.has(id)
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
	console.timeEnd('processing');

	return { borders, hyperlanesPath, relayHyperlanesPath };
}

function multiPolygonToPath(
	featureCollection: helpers.FeatureCollection<
		helpers.MultiPolygon | helpers.Polygon,
		helpers.Properties
	>,
	settings: MapSettings
) {
	const coordinates = featureCollection.features.flatMap((feature) =>
		feature.geometry.type === 'MultiPolygon'
			? feature.geometry.coordinates
			: [feature.geometry.coordinates]
	);
	return coordinates
		.flat()
		.map((points) => points.map<[number, number]>((point) => [point[0] * SCALE, point[1] * SCALE]))
		.map((points) => {
			const pathContext = pathRound(3);
			const curve = settings.borderSmoothing
				? curveBasisClosed(pathContext)
				: curveLinearClosed(pathContext);
			curve.lineStart();
			for (const point of points) {
				curve.point(-point[0], point[1]);
			}
			curve.lineEnd();
			return pathContext.toString();
		})
		.join(' ');
}
