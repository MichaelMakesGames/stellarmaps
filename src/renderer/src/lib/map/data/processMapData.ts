import type { GameState } from '../../GameState';
import type { MapSettings } from '../../mapSettings';
import { timeIt, timeItAsync } from '../../utils';
import processBorders from './processBorders';
import processBypassLinks from './processBypassLinks';
import processCircularGalaxyBorders from './processCircularGalaxyBorder';
import { processEmblems } from './processEmblems';
import processHyperRelays from './processHyperRelays';
import processLabels from './processLabels';
import processNames from './processNames';
import processPolygons from './processPolygons';
import processSystemCoordinates from './processSystemCoordinates';
import processSystemOwnership from './processSystemOwnership';
import processSystems from './processSystems';
import processTerraIncognita from './processTerraIncognita';
import processTerraIncognitaPath from './processTerraIncognitaPath';
import processVoronoi from './processVoronoi';
import { createHyperlanePaths } from './utils';

export default async function processMapData(gameState: GameState, settings: MapSettings) {
	// get these started right away; await just before needed
	const emblemsPromise = timeItAsync('emblems', processEmblems, Object.values(gameState.country));
	const countryNamesPromise = timeItAsync('names', processNames, gameState);

	const getSystemCoordinates = timeIt(
		'system coordinates',
		processSystemCoordinates,
		gameState,
		settings,
	);

	const { galaxyBorderCircles, galaxyBorderCirclesGeoJSON } = timeIt(
		'circular galaxy borders',
		processCircularGalaxyBorders,
		gameState,
		settings,
		getSystemCoordinates,
	);

	const { knownSystems, knownCountries, knownWormholes } = timeIt(
		'terra incognita',
		processTerraIncognita,
		gameState,
		settings,
	);

	const {
		sectorToSystemIds,
		countryToSystemIds,
		unionLeaderToSystemIds,
		unionLeaderToUnionMembers,
		ownedSystemPoints,
		systemIdToCountry,
		systemIdToUnionLeader,
	} = timeIt('system ownership', processSystemOwnership, gameState, settings, getSystemCoordinates);

	const { findClosestSystem, voronoi, systemIdToVoronoiIndexes } = timeIt(
		'voronoi',
		processVoronoi,
		gameState,
		settings,
		getSystemCoordinates,
	);

	const { sectorToGeojson, countryToGeojson, unionLeaderToGeojson, terraIncognitaGeojson } = timeIt(
		'polygons',
		processPolygons,
		gameState,
		settings,
		voronoi,
		systemIdToVoronoiIndexes,
		sectorToSystemIds,
		countryToSystemIds,
		unionLeaderToSystemIds,
		knownSystems,
	);

	const { terraIncognitaPath } = timeIt(
		'terra incognita path',
		processTerraIncognitaPath,
		gameState,
		settings,
		terraIncognitaGeojson,
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
			getSystemCoordinates,
		);
	const countryNames = await countryNamesPromise;
	const labels = timeIt(
		'labels',
		processLabels,
		gameState,
		settings,
		countryToGeojson,
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
		unionLeaderToGeojson,
		countryToGeojson,
		sectorToGeojson,
		unionLeaderToUnionMembers,
		countryToSystemIds,
		systemIdToUnionLeader,
		relayMegastructures,
		knownCountries,
		galaxyBorderCirclesGeoJSON,
		getSystemCoordinates,
	);
	const systems = timeIt(
		'systems',
		processSystems,
		gameState,
		settings,
		systemIdToCountry,
		knownCountries,
		knownSystems,
		getSystemCoordinates,
	);
	const bypassLinks = timeIt(
		'bypassLinks',
		processBypassLinks,
		gameState,
		knownSystems,
		knownWormholes,
		getSystemCoordinates,
	);
	const emblems = await emblemsPromise;

	return {
		borders,
		unownedHyperlanesPath,
		unownedRelayHyperlanesPath,
		emblems,
		systems,
		bypassLinks,
		labels,
		terraIncognitaPath,
		galaxyBorderCircles,
		findClosestSystem,
	};
}

export type MapData = Awaited<ReturnType<typeof processMapData>>;
