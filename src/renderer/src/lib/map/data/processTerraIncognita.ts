import type { GameState } from '../../GameState';
import type { MapSettings } from '../../mapSettings';
import * as helpers from '@turf/helpers';
import { joinSystemPolygons, multiPolygonToPath } from './utils';
import type { Delaunay } from 'd3-delaunay';

export default function processTerraIncognita(
	gameState: GameState,
	settings: MapSettings,
	systemIdToPolygon: Record<string, Delaunay.Polygon>,
	galaxyBorderCirclesGeoJSON: ReturnType<typeof joinSystemPolygons>,
) {
	const terraIncognitaPerspectiveCountryId =
		settings.terraIncognitaPerspectiveCountry === 'player'
			? gameState.player.filter((p) => gameState.country[p.country])[0]?.country
			: parseInt(settings.terraIncognitaPerspectiveCountry);
	const terraIncognitaPerspectiveCountry =
		terraIncognitaPerspectiveCountryId != null
			? gameState.country[terraIncognitaPerspectiveCountryId]
			: null;
	const knownSystems = new Set(
		terraIncognitaPerspectiveCountry?.terra_incognita?.systems ??
			Object.keys(gameState.galactic_object).map((id) => parseInt(id)),
	);
	const unknownSystems = Object.keys(gameState.galactic_object)
		.map((key) => parseInt(key))
		.filter((id) => !knownSystems.has(id));
	const wormholeIds = new Set(
		Object.values(gameState.bypasses)
			.filter((bypass) => bypass.type === 'wormhole')
			.map((bypass) => bypass.id),
	);
	const knownWormholes = terraIncognitaPerspectiveCountry
		? new Set(terraIncognitaPerspectiveCountry.usable_bypasses.filter((id) => wormholeIds.has(id)))
		: wormholeIds;
	const knownCountries = new Set(
		terraIncognitaPerspectiveCountryId == null
			? Object.keys(gameState.country).map((id) => parseInt(id))
			: (terraIncognitaPerspectiveCountry?.relations_manager.relation ?? [])
					.filter((relation) => relation.communications)
					.map((relation) => relation.country),
	);
	if (terraIncognitaPerspectiveCountryId != null)
		knownCountries.add(terraIncognitaPerspectiveCountryId);
	const terraIncognitaGeoJSON = joinSystemPolygons(
		unknownSystems.map((systemId) => systemIdToPolygon[systemId]),
		galaxyBorderCirclesGeoJSON,
	);
	const terraIncognitaPath =
		terraIncognitaGeoJSON == null
			? ''
			: multiPolygonToPath(
					helpers.featureCollection([terraIncognitaGeoJSON]),
					settings.borderStroke.smoothing,
				);
	return {
		terraIncognitaPath,
		knownSystems,
		knownCountries,
		knownWormholes,
	};
}
