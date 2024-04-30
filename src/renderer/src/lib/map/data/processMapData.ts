import * as R from 'rambda';
import { get } from 'svelte/store';
import type { GameState } from '../../GameState';
import debug from '../../debug';
import type { MapSettings } from '../../settings';
import { timeIt, timeItAsync } from '../../utils';
import processBorders, { processBordersDeps } from './processBorders';
import processBypassLinks from './processBypassLinks';
import processCircularGalaxyBorders, {
	processCircularGalaxyBordersDeps,
} from './processCircularGalaxyBorder';
import { processEmblems } from './processEmblems';
import processHyperRelays from './processHyperRelays';
import processLabels, { processLabelsDeps } from './processLabels';
import processNames from './processNames';
import processPolygons, { processPolygonsDeps } from './processPolygons';
import processSystemCoordinates, { processSystemCoordinatesDeps } from './processSystemCoordinates';
import processSystemOwnership, { processSystemOwnershipDeps } from './processSystemOwnership';
import processSystems, { processSystemsDeps } from './processSystems';
import processTerraIncognita, { processTerraIncognitaDeps } from './processTerraIncognita';
import processTerraIncognitaPath, {
	processTerraIncognitaPathDeps,
} from './processTerraIncognitaPath';
import processVoronoi, { processVoronoiDeps } from './processVoronoi';
import { createHyperlanePaths } from './utils';

export default async function processMapData(gameState: GameState, rawSettings: MapSettings) {
	console.time('TOTAL PROCESSING TIME');
	const settings = { ...rawSettings };
	if (settings.hyperlaneMetroStyle) settings.alignStarsToGrid = true;
	if (settings.alignStarsToGrid) settings.hyperlaneSensitiveBorders = false;

	// get these started right away; await just before needed
	const emblemsPromise = timeItAsync(
		'emblems',
		cached(processEmblems),
		Object.values(gameState.country),
	);
	const countryNamesPromise = timeItAsync('names', cached(processNames), gameState);

	const getSystemCoordinates = timeIt(
		'system coordinates',
		cached(processSystemCoordinates),
		gameState,
		pickSettings(settings, processSystemCoordinatesDeps),
	);

	const { galaxyBorderCircles, galaxyBorderCirclesGeoJSON } = timeIt(
		'circular galaxy borders',
		cached(processCircularGalaxyBorders),
		gameState,
		pickSettings(settings, processCircularGalaxyBordersDeps),
		getSystemCoordinates,
	);

	const { knownSystems, knownCountries, knownWormholes } = timeIt(
		'terra incognita',
		cached(processTerraIncognita),
		gameState,
		pickSettings(settings, processTerraIncognitaDeps),
	);

	const {
		sectorToSystemIds,
		countryToSystemIds,
		unionLeaderToSystemIds,
		unionLeaderToUnionMembers,
		ownedSystemPoints,
		systemIdToCountry,
		systemIdToUnionLeader,
		sectorToCountry,
		unionLeaderToSectors,
	} = timeIt(
		'system ownership',
		cached(processSystemOwnership),
		gameState,
		pickSettings(settings, processSystemOwnershipDeps),
		getSystemCoordinates,
	);

	const { findClosestSystem, voronoi, systemIdToVoronoiIndexes } = timeIt(
		'voronoi',
		cached(processVoronoi),
		gameState,
		pickSettings(settings, processVoronoiDeps),
		getSystemCoordinates,
		galaxyBorderCircles,
	);

	const { sectorToGeojson, countryToGeojson, unionLeaderToGeojson, terraIncognitaGeojson } = timeIt(
		'polygons',
		cached(processPolygons),
		gameState,
		pickSettings(settings, processPolygonsDeps),
		voronoi,
		systemIdToVoronoiIndexes,
		sectorToSystemIds,
		countryToSystemIds,
		unionLeaderToSystemIds,
		unionLeaderToSectors,
		sectorToCountry,
		knownSystems,
	);

	const { terraIncognitaPath } = timeIt(
		'terra incognita path',
		cached(processTerraIncognitaPath),
		gameState,
		pickSettings(settings, processTerraIncognitaPathDeps),
		terraIncognitaGeojson,
		galaxyBorderCirclesGeoJSON,
	);

	const relayMegastructures = timeIt('hyper relays', cached(processHyperRelays), gameState);
	const { hyperlanesPath: unownedHyperlanesPath, relayHyperlanesPath: unownedRelayHyperlanesPath } =
		timeIt(
			'unowned hyperlanes',
			cached(createHyperlanePaths),
			gameState,
			pickSettings(settings, ['hyperlaneMetroStyle']),
			relayMegastructures,
			systemIdToUnionLeader,
			null,
			getSystemCoordinates,
		);
	const borders = timeIt(
		'borders',
		cached(processBorders),
		gameState,
		pickSettings(settings, processBordersDeps),
		unionLeaderToGeojson,
		countryToGeojson,
		sectorToGeojson,
		unionLeaderToUnionMembers,
		unionLeaderToSystemIds,
		countryToSystemIds,
		systemIdToUnionLeader,
		relayMegastructures,
		knownCountries,
		galaxyBorderCircles,
		galaxyBorderCirclesGeoJSON,
		getSystemCoordinates,
	);
	const countryNames = await countryNamesPromise;
	const labels = timeIt(
		'labels',
		cached(processLabels),
		gameState,
		pickSettings(settings, processLabelsDeps),
		countryToGeojson,
		unionLeaderToUnionMembers,
		borders,
		countryNames,
		knownCountries,
		ownedSystemPoints,
	);
	const systems = timeIt(
		'systems',
		cached(processSystems),
		gameState,
		pickSettings(settings, processSystemsDeps),
		systemIdToCountry,
		knownCountries,
		knownSystems,
		getSystemCoordinates,
	);
	const bypassLinks = timeIt(
		'bypassLinks',
		cached(processBypassLinks),
		gameState,
		knownSystems,
		knownWormholes,
		getSystemCoordinates,
	);
	const emblems = await emblemsPromise;

	console.timeEnd('TOTAL PROCESSING TIME');

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

// eslint-disable-next-line @typescript-eslint/ban-types
const cachedMemo: Map<Function, Function> = new Map();
function cached<Args extends unknown[], ReturnValue>(
	fn: (...args: Args) => ReturnValue,
): (...args: Args) => ReturnValue {
	const memoValue = cachedMemo.get(fn);
	if (memoValue) return memoValue as (...args: Args) => ReturnValue;
	let last: [Args, ReturnValue] | null = null;
	const fnWithCaching = (...args: Args) => {
		if (
			!get(debug) &&
			last !== null &&
			last[0].length === args.length &&
			last[0].every((arg, i) => arg === args[i])
		) {
			return last[1];
		} else {
			const result = fn(...args);
			last = [args, result];
			return result;
		}
	};
	cachedMemo.set(fn, fnWithCaching);
	return fnWithCaching;
}

const pickSettingsMemo: Record<string, Partial<MapSettings>> = {};
function pickSettings<K extends keyof MapSettings>(
	settings: MapSettings,
	keys: K[],
): Pick<MapSettings, K> {
	const memoKey = keys.toSorted().join();
	const memoValue = pickSettingsMemo[memoKey];
	if (memoValue && keys.every((key) => R.equals(memoValue[key], settings[key]))) {
		return memoValue as Pick<MapSettings, K>;
	} else {
		const value = Object.fromEntries(keys.map((key) => [key, settings[key]])) as Pick<
			MapSettings,
			K
		>;
		pickSettingsMemo[memoKey] = value;
		return value;
	}
}
