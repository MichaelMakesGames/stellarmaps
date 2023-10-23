import type { GameState } from '../../GameState';
import type { MapSettings } from '../../mapSettings';
import { timeIt, timeItAsync } from '../../utils';
import processBorders from './processBorders';
import processCircularGalaxyBorders from './processCircularGalaxyBorder';
import { processEmblems } from './processEmblems';
import processHyperRelays from './processHyperRelays';
import processLabels from './processLabels';
import processNames from './processNames';
import processSystemCoordinates from './processSystemCoordinates';
import processSystemOwnership from './processSystemOwnership';
import processSystems from './processSystems';
import processTerraIncognita from './processTerraIncognita';
import processVoronoi from './processVoronoi';
import { createHyperlanePaths } from './utils';

export default async function processMapData(gameState: GameState, settings: MapSettings) {
	const systemIdToCoordinates = timeIt(
		'system coordinates',
		processSystemCoordinates,
		gameState,
		settings,
	);
	const voronoi = timeIt('voronoi', processVoronoi, gameState, settings, systemIdToCoordinates);
	const countryNames = await timeItAsync('names', processNames, gameState);
	const {
		countryToOwnedSystemIds,
		countryToSystemPolygons,
		unionLeaderToSystemPolygons,
		unionLeaderToUnionMembers,
		ownedSystemPoints,
		systemIdToPolygon,
		systemIdToCountry,
		systemIdToUnionLeader,
	} = timeIt(
		'system ownership',
		processSystemOwnership,
		gameState,
		settings,
		voronoi,
		systemIdToCoordinates,
	);
	const { galaxyBorderCircles, galaxyBorderCirclesGeoJSON } = timeIt(
		'circular galaxy borders',
		processCircularGalaxyBorders,
		gameState,
		settings,
		systemIdToCoordinates,
	);
	const { terraIncognitaPath, knownSystems, knownCountries } = timeIt(
		'terra incognita',
		processTerraIncognita,
		gameState,
		settings,
		systemIdToPolygon,
		galaxyBorderCirclesGeoJSON,
	);
	const relayMegastructures = timeIt('hyper relays', processHyperRelays, gameState);
	const { hyperlanesPath: unownedHyperlanesPath, relayHyperlanesPath: unownedRelayHyperlanesPath } =
		timeIt(
			'unowned hyperlanes',
			createHyperlanePaths,
			gameState,
			settings,
			relayMegastructures,
			systemIdToUnionLeader,
			null,
			systemIdToCoordinates,
		);
	const labels = timeIt(
		'labels',
		processLabels,
		gameState,
		settings,
		countryToSystemPolygons,
		countryNames,
		galaxyBorderCirclesGeoJSON,
		knownCountries,
		ownedSystemPoints,
	);
	const borders = timeIt(
		'borders',
		processBorders,
		gameState,
		settings,
		unionLeaderToSystemPolygons,
		unionLeaderToUnionMembers,
		countryToOwnedSystemIds,
		systemIdToPolygon,
		systemIdToUnionLeader,
		relayMegastructures,
		knownCountries,
		galaxyBorderCirclesGeoJSON,
		systemIdToCoordinates,
	);
	const systems = timeIt(
		'systems',
		processSystems,
		gameState,
		settings,
		systemIdToCountry,
		knownCountries,
		knownSystems,
		systemIdToCoordinates,
	);
	const emblems = await timeItAsync('emblems', processEmblems, Object.values(gameState.country));

	return {
		borders,
		unownedHyperlanesPath,
		unownedRelayHyperlanesPath,
		emblems,
		systems,
		labels,
		terraIncognitaPath,
		galaxyBorderCircles,
	};
}

export type MapData = Awaited<ReturnType<typeof processMapData>>;
