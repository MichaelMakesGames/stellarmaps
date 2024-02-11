import { Delaunay } from 'd3-delaunay';
import type { GalacticObject, GameState } from '../../GameState';
import type { MapSettings } from '../../mapSettings';

const MAX_BORDER_DISTANCE = 700; // systems further from the center than this will not have country borders
export default function processVoronoi(
	gameState: GameState,
	settings: MapSettings,
	getSystemCoordinates: (id: number, options?: { invertX?: boolean }) => [number, number],
) {
	const points = Object.values(gameState.galactic_object).map((system) =>
		getSystemCoordinates(system.id),
	);
	const gridSize = 20;
	const minDistanceSquared = 40 ** 2;
	const extraPoints: [number, number][] = [];
	for (let x = -MAX_BORDER_DISTANCE; x <= MAX_BORDER_DISTANCE; x += gridSize) {
		for (let y = -MAX_BORDER_DISTANCE; y <= MAX_BORDER_DISTANCE; y += gridSize) {
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
	const systems = Object.values(gameState.galactic_object);
	function findClosestSystem(x: number, y: number): GalacticObject | null {
		const index = delaunay.find(x, y);
		const system = systems[index];
		return system ?? null;
	}
	return { voronoi, findClosestSystem };
}
