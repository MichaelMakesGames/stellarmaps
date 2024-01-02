import type { Bypass, GameState } from '$lib/GameState';
import { parseNumberEntry } from '$lib/utils';

export default function processWormholes(
	gameState: GameState,
	knownWormholes: Set<number>,
	systemIdToCoordinates: Record<number, [number, number]>,
) {
	const wormholes: Record<
		string,
		{ isKnown: boolean; from: { x: number; y: number }; to: { x: number; y: number } }
	> = {};
	Object.entries(gameState.galactic_object)
		.map(parseNumberEntry)
		.forEach(([systemId, system]) => {
			const fromX = -systemIdToCoordinates[systemId][0];
			const fromY = systemIdToCoordinates[systemId][1];

			const [wormholeBypassId, wormholeBypass] = system.bypasses
				?.map((bypassId) => [bypassId, gameState.bypasses[bypassId]] as [number, Bypass])
				.find((b) => b[1]?.type === 'wormhole') ?? [null, null];
			const isKnown = wormholeBypassId != null && knownWormholes.has(wormholeBypassId);
			const wormholeLinksTo: undefined | number = Object.entries(gameState.galactic_object)
				.map(parseNumberEntry)
				.filter(([id, go]) => go.bypasses?.includes(wormholeBypass?.linked_to as number))
				.map(([id]) => id)[0];
			const key = [systemId, wormholeLinksTo].sort().toString();
			if (wormholeLinksTo != null && !wormholes[key]) {
				const toX = -systemIdToCoordinates[wormholeLinksTo][0];
				const toY = systemIdToCoordinates[wormholeLinksTo][1];
				wormholes[key] = {
					isKnown,
					from: { x: fromX, y: fromY },
					to: { x: toX, y: toY },
				};
			}
		});
	return Object.values(wormholes);
}
