import { Delaunay } from 'd3-delaunay';
import type { Country, GameState } from './GameState';

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
	const fleetToCountry: Record<string, Country> = {};
	Object.values(gameState.country).forEach((country) => {
		country.fleets_manager?.owned_fleets?.forEach((owned_fleet) => {
			fleetToCountry[owned_fleet.fleet] = country;
		});
	});
	const systems = Object.values(gameState?.galactic_object ?? {}).map((go, i) => {
		const starbase = gameState.starbase_mgr.starbases[go.starbases[0]];
		const owner = starbase ? fleetToCountry[gameState.ships[starbase.station].fleet] : null;
		const color = owner ? owner.flag.colors[0].replaceAll('_', '') : '#111';
		const path = voronoi.renderCell(i);
		return { color, path };
	});
	console.timeEnd('processing');

	return { systems };
}
