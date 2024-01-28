import type { Bypass, GameState } from '../../GameState';
import { parseNumberEntry } from '../../utils';

export default function processBypassLinks(
	gameState: GameState,
	knownSystems: Set<number>,
	knownWormholes: Set<number>,
	systemIdToCoordinates: Record<number, [number, number]>,
) {
	const bypassLinks: Record<
		string,
		{ type: string; isKnown: boolean; from: { x: number; y: number }; to: { x: number; y: number } }
	> = {};

	const [lGateNexusId, lGateNexus] = Object.entries(gameState.galactic_object)
		.map(parseNumberEntry)
		.find(([_id, object]) => object.flags?.lcluster1) ?? [null, null];

	const [shroudTunnelNexusId, shroudTunnelNexus] = Object.entries(gameState.galactic_object)
		.map(parseNumberEntry)
		.find(([_id, object]) => object.flags?.shroud_tunnel_nexus) ?? [null, null];

	Object.entries(gameState.galactic_object)
		.map(parseNumberEntry)
		.forEach(([systemId, system]) => {
			const fromX = -systemIdToCoordinates[systemId][0];
			const fromY = systemIdToCoordinates[systemId][1];

			const bypassTypes = new Set(
				system.bypasses?.map((bypassId) => gameState.bypasses[bypassId]?.type),
			);

			const [wormholeBypassId, wormholeBypass] = system.bypasses
				?.map((bypassId) => [bypassId, gameState.bypasses[bypassId]] as [number, Bypass])
				.find((b) => b[1]?.type === 'wormhole') ?? [null, null];
			const wormholeIsKnown = wormholeBypassId != null && knownWormholes.has(wormholeBypassId);
			const wormholeLinksTo: undefined | number = Object.entries(gameState.galactic_object)
				.map(parseNumberEntry)
				.filter(([_id, go]) => go.bypasses?.includes(wormholeBypass?.linked_to as number))
				.map(([id]) => id)[0];
			const key = `wormhole-${[systemId, wormholeLinksTo].sort()}`;
			if (wormholeLinksTo != null && !bypassLinks[key]) {
				const toX = -systemIdToCoordinates[wormholeLinksTo][0];
				const toY = systemIdToCoordinates[wormholeLinksTo][1];
				bypassLinks[key] = {
					type: 'wormhole',
					isKnown: wormholeIsKnown,
					from: { x: fromX, y: fromY },
					to: { x: toX, y: toY },
				};
			}

			if (lGateNexusId != null && lGateNexus != null && systemId !== lGateNexusId) {
				if (bypassTypes.has('lgate')) {
					bypassLinks[`lgate-${systemId}`] = {
						type: 'lgate',
						isKnown: knownSystems.has(lGateNexusId) && knownSystems.has(systemId),
						from: { x: fromX, y: fromY },
						to: {
							x: -systemIdToCoordinates[lGateNexusId][0],
							y: systemIdToCoordinates[lGateNexusId][1],
						},
					};
				}
			}

			if (
				shroudTunnelNexusId != null &&
				shroudTunnelNexus != null &&
				systemId !== shroudTunnelNexusId
			) {
				if (bypassTypes.has('shroud_tunnel')) {
					bypassLinks[`shrould_tunnel-${systemId}`] = {
						type: 'shroud_tunnel',
						isKnown: knownSystems.has(shroudTunnelNexusId) && knownSystems.has(systemId),
						from: { x: fromX, y: fromY },
						to: {
							x: -systemIdToCoordinates[shroudTunnelNexusId][0],
							y: systemIdToCoordinates[shroudTunnelNexusId][1],
						},
					};
				}
			}
		});

	return Object.values(bypassLinks);
}
