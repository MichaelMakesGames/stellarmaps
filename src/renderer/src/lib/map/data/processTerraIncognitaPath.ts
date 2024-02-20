import type { GameState } from '../../GameState';
import type { MapSettings } from '../../mapSettings';
import { applyGalaxyBoundary, multiPolygonToPath, type PolygonalFeature } from './utils';

export default function processTerraIncognitaPath(
	gameState: GameState,
	settings: MapSettings,
	terraIncognitaGeojson: PolygonalFeature | null,
	galaxyBorderCirclesGeoJSON: PolygonalFeature | null,
) {
	if (terraIncognitaGeojson == null) return { terraIncognitaPath: '' };
	const bounded = applyGalaxyBoundary(terraIncognitaGeojson, galaxyBorderCirclesGeoJSON);
	if (bounded == null) return { terraIncognitaPath: '' };
	const terraIncognitaPath = multiPolygonToPath(bounded, settings.borderStroke.smoothing);
	return {
		terraIncognitaPath,
	};
}
