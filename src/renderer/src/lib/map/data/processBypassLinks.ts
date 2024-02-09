import type { Bypass, GameState } from '../../GameState';

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

	const lGateNexus = Object.values(gameState.galactic_object).find(
		(object) => object.flags?.lcluster1,
	);

	const shroudTunnelNexus = Object.values(gameState.galactic_object).find(
		(object) => object.flags?.shroud_tunnel_nexus,
	);

	Object.values(gameState.galactic_object).forEach((system) => {
		const fromX = -systemIdToCoordinates[system.id][0];
		const fromY = systemIdToCoordinates[system.id][1];

		const bypassTypes = new Set(
			system.bypasses?.map((bypassId) => gameState.bypasses[bypassId].type),
		);

		const wormholeBypass = system.bypasses
			?.map((bypassId) => gameState.bypasses[bypassId])
			.find((b: Bypass) => b.type === 'wormhole');
		const wormholeIsKnown = wormholeBypass != null && knownWormholes.has(wormholeBypass.id);
		const wormholeLinksTo = Object.values(gameState.galactic_object).find((go) =>
			go.bypasses?.includes(wormholeBypass?.linked_to as number),
		);
		if (wormholeLinksTo != null) {
			const key = `wormhole-${[system.id, wormholeLinksTo.id].sort()}`;
			if (!(key in bypassLinks)) {
				const toX = -systemIdToCoordinates[wormholeLinksTo.id][0];
				const toY = systemIdToCoordinates[wormholeLinksTo.id][1];
				bypassLinks[key] = {
					type: 'wormhole',
					isKnown: wormholeIsKnown,
					from: { x: fromX, y: fromY },
					to: { x: toX, y: toY },
				};
			}
		}

		if (lGateNexus && system.id !== lGateNexus.id) {
			if (bypassTypes.has('lgate')) {
				bypassLinks[`lgate-${system.id}`] = {
					type: 'lgate',
					isKnown: knownSystems.has(lGateNexus.id) && knownSystems.has(system.id),
					from: { x: fromX, y: fromY },
					to: {
						x: -systemIdToCoordinates[lGateNexus.id][0],
						y: systemIdToCoordinates[lGateNexus.id][1],
					},
				};
			}
		}

		if (shroudTunnelNexus != null && system.id !== shroudTunnelNexus.id) {
			if (bypassTypes.has('shroud_tunnel')) {
				bypassLinks[`shrould_tunnel-${system.id}`] = {
					type: 'shroud_tunnel',
					isKnown: knownSystems.has(shroudTunnelNexus.id) && knownSystems.has(system.id),
					from: { x: fromX, y: fromY },
					to: {
						x: -systemIdToCoordinates[shroudTunnelNexus.id][0],
						y: systemIdToCoordinates[shroudTunnelNexus.id][1],
					},
				};
			}
		}
	});

	return Object.values(bypassLinks);
}
