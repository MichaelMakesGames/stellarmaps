import type { GameState } from '$lib/GameState';
import type { MapSettings } from '$lib/mapSettings';
import { Delaunay } from 'd3-delaunay';

const MAX_BORDER_DISTANCE = 700; // systems further from the center than this will not have country borders
export default function processVoronoi(gameState: GameState, settings: MapSettings) {
	const points = Object.values(gameState.galactic_object).map<[number, number]>((go) => [
		go.coordinate.x,
		go.coordinate.y,
	]);
	const minDistanceSquared = 35 ** 2;
	const extraPoints: [number, number][] = [];
	for (let x = -MAX_BORDER_DISTANCE; x <= MAX_BORDER_DISTANCE; x += 10) {
		for (let y = -MAX_BORDER_DISTANCE; y <= MAX_BORDER_DISTANCE; y += 10) {
			if (
				points.some(
					([otherX, otherY]) => (otherX - x) ** 2 + (otherY - y) ** 2 < minDistanceSquared,
				)
			) {
				// do nothing
			} else {
				extraPoints.push([x, y]);
			}
		}
	}
	if (!settings.circularGalaxyBorders) {
		points.push(...extraPoints);
	}
	const delaunay = Delaunay.from(points);
	const voronoi = delaunay.voronoi([
		-MAX_BORDER_DISTANCE,
		-MAX_BORDER_DISTANCE,
		MAX_BORDER_DISTANCE,
		MAX_BORDER_DISTANCE,
	]);
	return voronoi;
}
