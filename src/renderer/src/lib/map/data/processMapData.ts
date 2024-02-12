import type { GameState } from '../../GameState';
import type { MapSettings } from '../../mapSettings';
import { timeIt, timeItAsync } from '../../utils';
import processBorders from './processBorders';
import processBypassLinks from './processBypassLinks';
import processCircularGalaxyBorders from './processCircularGalaxyBorder';
import { processEmblems } from './processEmblems';
import processFloodBorders from './processFloodBorders';
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
	// get these started right away; await just before needed
	const emblemsPromise = timeItAsync('emblems', processEmblems, Object.values(gameState.country));
	const countryNamesPromise = timeItAsync('names', processNames, gameState);

	const getSystemCoordinates = timeIt(
		'system coordinates',
		processSystemCoordinates,
		gameState,
		settings,
	);
	const { voronoi, findClosestSystem } = timeIt(
		'voronoi',
		processVoronoi,
		gameState,
		settings,
		getSystemCoordinates,
	);
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
		getSystemCoordinates,
	);
	const { galaxyBorderCircles, galaxyBorderCirclesGeoJSON } = timeIt(
		'circular galaxy borders',
		processCircularGalaxyBorders,
		gameState,
		settings,
		getSystemCoordinates,
	);
	const { terraIncognitaPath, knownSystems, knownCountries, knownWormholes } = timeIt(
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
			getSystemCoordinates,
		);
	const countryNames = await countryNamesPromise;
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

	const floodBorders = timeIt(
		'floodBorders',
		processFloodBorders,
		gameState,
		settings,
		systemIdToUnionLeader,
		getSystemCoordinates,
	);

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
		floodBorders,
	};
}

export type MapData = Awaited<ReturnType<typeof processMapData>>;
