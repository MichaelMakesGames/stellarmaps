import type { GameState } from '$lib/GameState';
import type { MapSettings } from '$lib/mapSettings';
import { parseNumberEntry } from '$lib/utils';
import { positionToString } from './utils';

export default function processSystemCoordinates(gameState: GameState, settings: MapSettings) {
	const systemIdToCoordinates: Record<number, [number, number]> = {};
	const usedCoordinates = new Set(
		...Object.values(gameState.galactic_object).map((go) =>
			positionToString([go.coordinate.x, go.coordinate.y]),
		),
	);
	for (const [id, go] of Object.entries(gameState.galactic_object).map(parseNumberEntry)) {
		const originalCoordinates: [number, number] = [go.coordinate.x, go.coordinate.y];
		const preferredCoordinates: [number, number][] = settings.alignStarsToGrid
			? [
					[
						Math.round(originalCoordinates[0] / 20) * 20,
						Math.round(originalCoordinates[1] / 20) * 20,
					],
					[
						Math.round(originalCoordinates[0] / 10) * 10,
						Math.round(originalCoordinates[1] / 10) * 10,
					],
					[Math.round(originalCoordinates[0] / 5) * 5, Math.round(originalCoordinates[1] / 5) * 5],
					originalCoordinates,
			  ]
			: [];
		const coordinates =
			preferredCoordinates.find((coords) => !usedCoordinates.has(positionToString(coords))) ??
			originalCoordinates;
		usedCoordinates.add(positionToString(coordinates));
		systemIdToCoordinates[id] = coordinates;
	}
	console.warn(systemIdToCoordinates);
	return systemIdToCoordinates;
}
