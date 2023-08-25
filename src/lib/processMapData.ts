import buffer from '@turf/buffer';
import union from '@turf/union';
import polygonSmooth from '@turf/polygon-smooth';
import * as helpers from '@turf/helpers';
import booleanContains from '@turf/boolean-contains';
import { Delaunay } from 'd3-delaunay';
import polylabel from 'polylabel';
// eslint-disable-next-line
// @ts-ignore
import { pathRound } from 'd3-path';
import { curveBasisClosed, curveLinearClosed } from 'd3-shape';
import type { Bypass, Country, GameState, LocalizedText } from './GameState';
import type { MapSettings } from './mapSettings';
import { loadEmblem, loadLoc } from './tauriCommands';

const SCALE = 100;

export default async function processMapData(gameState: GameState, settings: MapSettings) {
	console.time('generating voronoi');
	const points = Object.values(gameState.galactic_object).map<[number, number]>((go) => [
		go.coordinate.x,
		go.coordinate.y,
	]);
	const minDistanceSquared = 35 ** 2;
	const extraPoints: [number, number][] = [];
	for (let x = -500; x <= 500; x += 10) {
		for (let y = -500; y <= 500; y += 10) {
			if (
				points.some(
					([otherX, otherY]) => (otherX - x) ** 2 + (otherY - y) ** 2 < minDistanceSquared,
				)
			) {
				// do nothing
			} else {
				extraPoints.push([x, y]);
			}
		}
	}
	points.push(...extraPoints);
	const delaunay = Delaunay.from(points);
	const voronoi = delaunay.voronoi([-500, -500, 500, 500]);
	console.timeEnd('generating voronoi');

	console.time('localizing country names');
	const countryNames = await localizeCountryNames(gameState.country);
	console.timeEnd('localizing country names');

	console.time('processing');
	const fleetToCountry: Record<string, number> = {};
	Object.entries(gameState.country).forEach(([countryId, country]) => {
		country.fleets_manager?.owned_fleets?.forEach((owned_fleet) => {
			fleetToCountry[owned_fleet.fleet] = parseFloat(countryId);
		});
	});
	const countryToSystemPolygon: Record<string, Delaunay.Polygon[]> = {};
	Object.values(gameState?.galactic_object ?? {}).forEach((go, i) => {
		const starbase = gameState.starbase_mgr.starbases[go.starbases[0]];
		const ownerId = starbase ? fleetToCountry[gameState.ships[starbase.station].fleet] : null;
		const owner = ownerId != null ? gameState.country[ownerId] : null;
		if (ownerId != null && owner) {
			const polygon = voronoi.cellPolygon(i);
			if (!countryToSystemPolygon[ownerId]) {
				countryToSystemPolygon[ownerId] = [];
			}
			countryToSystemPolygon[ownerId].push(polygon);
		}
	});
	const borders = Object.entries(countryToSystemPolygon).map(([countryId, polygons]) => {
		const name = countryNames[countryId] ?? '';
		const country = gameState.country[parseInt(countryId)];
		const primaryColor = country.flag?.colors[0] ?? 'black';
		const secondaryColor = country.flag?.colors[1] ?? 'black';
		const multiPolygon = helpers.multiPolygon(
			polygons.map((polygon) => [polygon.map(pointToGeoJSON)]),
		);
		let outer = helpers.featureCollection([
			union(multiPolygon, multiPolygon) as helpers.Feature<helpers.MultiPolygon | helpers.Polygon>,
		]);
		// TODO will need a better solution to support other languages (eg double width CJK chars)
		const textAspectRatio = name && settings.countryNames ? (1 / name.length) * 2 : 0;
		const emblemAspectRatio = settings.countryEmblems ? 1 / 1 : 0;
		let searchAspectRatio = 0;
		if (settings.countryEmblems && settings.countryNames) {
			searchAspectRatio = textAspectRatio + emblemAspectRatio / 2;
		} else if (settings.countryEmblems) {
			searchAspectRatio = emblemAspectRatio;
		} else if (settings.countryNames) {
			searchAspectRatio = textAspectRatio;
		}
		const labelPoints = searchAspectRatio
			? getPolygons(outer)
					// .map((p) => helpers.polygon([p.coordinates[0]]).geometry) // TODO ignore holes setting (ignore only 'unowned' holes?)
					.map<[helpers.Polygon, helpers.Position]>((polygon) => [
						polygon,
						aspectRatioSensitivePolylabel(polygon.coordinates, 0.01, searchAspectRatio),
					])
					.map(([polygon, point]) => {
						let textWidth = textAspectRatio
							? findLargestContainedRect({
									polygon,
									relativePoint: point,
									relativePointType: emblemAspectRatio ? 'top' : 'middle',
									ratio: textAspectRatio,
									iterations: 8,
							  })
							: null;
						if (
							textWidth &&
							settings.countryNamesMinSize &&
							textWidth * textAspectRatio * SCALE < settings.countryNamesMinSize
						) {
							textWidth = null;
						}
						if (
							textWidth &&
							settings.countryNamesMaxSize &&
							textWidth * textAspectRatio * SCALE > settings.countryNamesMaxSize
						) {
							textWidth = settings.countryNamesMaxSize / SCALE / textAspectRatio;
						}
						let emblemWidth = emblemAspectRatio
							? findLargestContainedRect({
									polygon,
									relativePoint: point,
									relativePointType: textWidth ? 'bottom' : 'middle',
									ratio: emblemAspectRatio,
									iterations: 8,
							  })
							: null;
						if (
							emblemWidth &&
							settings.countryEmblemsMinSize &&
							emblemWidth * SCALE < settings.countryEmblemsMinSize
						) {
							emblemWidth = null;
						}
						if (
							emblemWidth &&
							settings.countryEmblemsMaxSize &&
							emblemWidth * SCALE > settings.countryEmblemsMaxSize
						) {
							emblemWidth = settings.countryEmblemsMaxSize / SCALE;
						}
						return {
							point: inverseX(pointFromGeoJSON(point)),
							emblemWidth: emblemWidth ? emblemWidth * SCALE : null,
							emblemHeight: emblemWidth ? emblemWidth * emblemAspectRatio * SCALE : null,
							textWidth: textWidth ? textWidth * SCALE : null,
							textHeight: textWidth ? textWidth * textAspectRatio * SCALE : null,
						};
					})
			: [];
		if (settings.borderSmoothing) {
			outer = polygonSmooth(
				union(multiPolygon, multiPolygon) as helpers.Feature<
					helpers.MultiPolygon | helpers.Polygon
				>,
				{ iterations: 2 },
			);
		}
		const inner = buffer(outer, -settings.borderWidth, { units: 'miles' });
		const outerPath = multiPolygonToPath(outer, settings);
		const innerPath = multiPolygonToPath(inner, settings);
		const emblemKey = country.flag?.icon
			? `${country.flag.icon.category}/${country.flag.icon.file}`
			: null;
		return {
			primaryColor,
			secondaryColor,
			outerPath,
			innerPath,
			labelPoints,
			name,
			emblemKey,
		};
	});

	const relayMegastructures = new Set(
		Object.values(gameState.bypasses)
			.filter(
				(bypass): bypass is Bypass & Required<Pick<Bypass, 'owner'>> =>
					bypass.type === 'relay_bypass' && bypass.owner?.type === 6,
			)
			.map((bypass) => bypass.owner.id),
	);
	const hyperlanes = new Set<string>();
	const relayHyperlanes = new Set<string>();
	Object.entries(gameState.galactic_object).forEach(([goId, go]) => {
		for (const hyperlane of go.hyperlane ?? []) {
			const isRelay =
				go.megastructures?.some((id) => relayMegastructures.has(id)) &&
				gameState.galactic_object[hyperlane.to].megastructures?.some((id) =>
					relayMegastructures.has(id),
				);
			const key = [goId, hyperlane.to].sort().join(',');
			if (isRelay) {
				relayHyperlanes.add(key);
			} else {
				hyperlanes.add(key);
			}
		}
	});
	const hyperlanesPath = Array.from(hyperlanes.values())
		.map((key) => {
			const [a, b] = key.split(',').map((id) => gameState.galactic_object[parseInt(id)]);
			return `M ${-a.coordinate.x} ${a.coordinate.y} L ${-b.coordinate.x} ${b.coordinate.y}`;
		})
		.join(' ');
	const relayHyperlanesPath = Array.from(relayHyperlanes.values())
		.map((key) => {
			const [a, b] = key.split(',').map((id) => gameState.galactic_object[parseInt(id)]);
			return `M ${-a.coordinate.x} ${a.coordinate.y} L ${-b.coordinate.x} ${b.coordinate.y}`;
		})
		.join(' ');
	console.timeEnd('processing');

	console.time('loading emblems');
	const emblems = await loadCountryEmblems(Object.values(gameState.country));
	console.timeEnd('loading emblems');

	return { borders, hyperlanesPath, relayHyperlanesPath, emblems };
}

function multiPolygonToPath(
	featureCollection: helpers.FeatureCollection<
		helpers.MultiPolygon | helpers.Polygon,
		helpers.Properties
	>,
	settings: MapSettings,
) {
	const coordinates = featureCollection.features.flatMap((feature) =>
		feature.geometry.type === 'MultiPolygon'
			? feature.geometry.coordinates
			: [feature.geometry.coordinates],
	);
	return coordinates
		.flat()
		.map((points) => points.map<[number, number]>(pointFromGeoJSON))
		.map((points) => {
			const pathContext = pathRound(3);
			const curve = settings.borderSmoothing
				? curveBasisClosed(pathContext)
				: curveLinearClosed(pathContext);
			curve.lineStart();
			for (const point of points.map(inverseX)) {
				curve.point(...point);
			}
			curve.lineEnd();
			return pathContext.toString();
		})
		.join(' ');
}

function getPolygons(
	geojson: helpers.FeatureCollection<helpers.MultiPolygon | helpers.Polygon>,
): helpers.Polygon[] {
	return geojson.features.flatMap((feature) => {
		if (feature.geometry.type === 'Polygon') {
			return [feature.geometry];
		} else {
			return feature.geometry.coordinates.map((coords) => helpers.polygon(coords).geometry);
		}
	});
}

function pointToGeoJSON([x, y]: [number, number]): [number, number] {
	return [x / SCALE, y / SCALE];
}

function pointFromGeoJSON(point: helpers.Position): [number, number] {
	return [point[0] * SCALE, point[1] * SCALE];
}

function inverseX([x, y]: [number, number]): [number, number] {
	return [-x, y];
}

function findLargestContainedRect({
	polygon,
	relativePoint,
	relativePointType,
	ratio,
	iterations,
}: {
	polygon: helpers.Polygon;
	relativePoint: helpers.Position;
	relativePointType: 'top' | 'bottom' | 'middle';
	ratio: number;
	iterations: number;
}) {
	let bestWidth: null | number = null;
	let failedWidth = null;
	let testWidth = 1;
	for (let i = 0; i < iterations; i++) {
		const testRect = makeRect(relativePoint, relativePointType, testWidth, testWidth * ratio);
		if (contains(polygon, testRect)) {
			bestWidth = testWidth;
			if (!failedWidth) {
				testWidth *= 2;
			} else {
				testWidth = (testWidth + failedWidth) / 2;
			}
		} else {
			failedWidth = testWidth;
			if (!bestWidth) {
				testWidth /= 2;
			} else {
				testWidth = (testWidth + bestWidth) / 2;
			}
		}
	}
	return bestWidth;
}

function makeRect(
	relativePoint: helpers.Position,
	relativePointType: 'top' | 'bottom' | 'middle',
	width: number,
	height: number,
): helpers.Polygon {
	const dx = width / 2;
	const dy = height / 2;
	const center = [relativePoint[0], relativePoint[1]];
	if (relativePointType === 'top') center[1] += dy;
	if (relativePointType === 'bottom') center[1] -= dy;
	// clockwise: [0,0],[0,1],[1,1],[1,0],[0,0]
	const points = [
		[center[0] - dx, center[1] - dy],
		[center[0] - dx, center[1] + dy],
		[center[0] + dx, center[1] + dy],
		[center[0] + dx, center[1] - dy],
		[center[0] - dx, center[1] - dy],
	];
	return helpers.polygon([points]).geometry;
}

const locPromise = loadLoc();
function localizeCountryNames(countries: Record<number, Country>) {
	return locPromise.then((loc) => {
		return Object.fromEntries(
			Object.entries(countries)
				.map<[number, Country]>(([id, c]) => [parseInt(id), c])
				.filter(
					(entry): entry is [number, Country & Required<Pick<Country, 'name'>>] =>
						entry[1].name != null,
				)
				.map(([id, c]) => [id, localizeText(c.name, loc)]),
		);
	});
}

function localizeText(text: LocalizedText, loc: Record<string, string>): string {
	if (text.key === '%ADJECTIVE%') {
		try {
			const var0 = text.variables?.[0];
			const var1 = text.variables?.[1];
			if (!var0 || !var1) throw new Error();
			return loc['adj_format']
				.replace('adj', localizeText(var0.value, loc))
				.replace('$1$', localizeText(var1.value, loc));
		} catch {
			console.warn(text);
			return 'LOCALIZATION FAILED';
		}
	} else if (text.key === '%ADJ%') {
		try {
			const var0 = text.variables?.[0];
			if (!var0 || !var0.value.variables) throw new Error();
			const adj = loc[var0.value.key];
			if (adj.includes('$1$')) {
				return localizeText(var0.value, loc);
			} else {
				return loc['adj_format']
					.replace('adj', adj)
					.replace('$1$', localizeText(var0.value.variables[0].value, loc));
			}
		} catch {
			console.warn(text);
			return 'LOCALIZATION FAILED';
		}
	}
	if (!loc[text.key]) return text.key;
	let value = loc[text.key];
	if (text.variables) {
		text.variables.forEach((variable) => {
			const localizedVariable = localizeText(variable.value, loc);
			value = value
				.replace(`$${variable.key}$`, localizedVariable)
				.replace(`[${variable.key}]`, localizedVariable)
				.replace(`<${variable.key}>`, localizedVariable);
		});
	}
	return value;
}

function aspectRatioSensitivePolylabel(
	polygon: number[][][],
	precision: number,
	aspectRatio: number,
) {
	const scaledPolygon = polygon.map((ring) =>
		ring.map((point) => [point[0] * aspectRatio, point[1]]),
	);
	const point = polylabel(scaledPolygon, precision);
	return [point[0] / aspectRatio, point[1]];
}

// The booleanContains function from turf doesn't seem to work with concave polygons
// This is stricter and simplified a bit since we know the inner shape is a rectangle
function contains(polygon: helpers.Polygon, rect: helpers.Polygon) {
	if (
		!booleanContains(polygon, helpers.point(rect.coordinates[0][0])) ||
		!booleanContains(polygon, helpers.point(rect.coordinates[0][1])) ||
		!booleanContains(polygon, helpers.point(rect.coordinates[0][2])) ||
		!booleanContains(polygon, helpers.point(rect.coordinates[0][3]))
	)
		return false;
	const minX = Math.min(...rect.coordinates[0].map((p) => p[0]));
	const maxX = Math.max(...rect.coordinates[0].map((p) => p[0]));
	const minY = Math.min(...rect.coordinates[0].map((p) => p[1]));
	const maxY = Math.max(...rect.coordinates[0].map((p) => p[1]));
	return !polygon.coordinates.flat().some(([x, y]) => {
		return x > minX && x < maxX && y > minY && y < maxY;
	});
}

// const initializeImageMagickPromise = initializeImageMagick('@imagemagick/magick-wasm/magick.wasm');
const emblems: Record<string, Promise<string>> = {};
async function loadCountryEmblems(countries: Country[]) {
	const promises: Promise<string>[] = [];
	const keys: string[] = [];
	countries.forEach((c) => {
		if (c.flag?.icon) {
			const key = `${c.flag.icon.category}/${c.flag.icon.file}`;
			if (keys.includes(key)) {
				// do nothing
			} else {
				keys.push(key);
				if (!(key in emblems)) {
					emblems[key] = loadEmblem(c.flag.icon.category, c.flag.icon.file).then((content) =>
						convertDds(key.replace('/', '__'), content),
					);
				}
				promises.push(emblems[key]);
			}
		}
	});
	const values = await Promise.all(promises);
	return values.reduce<Record<string, string>>((acc, cur, i) => {
		acc[keys[i]] = cur;
		return acc;
	}, {});
}

const magickImport = '/magickApi.js';
async function convertDds(key: string, content: Uint8Array) {
	const result = await (
		await import(magickImport)
	).execute({
		inputFiles: [{ name: 'test.dds', content: content }],
		commands: [`convert test.dds test.png`],
	});
	if (result.exitCode === 0) {
		const reader = new FileReader();
		const promise = new Promise<string>((resolve) => {
			reader.addEventListener('loadend', () => resolve(reader.result as string), true);
		});
		reader.readAsDataURL(new Blob([result.outputFiles[0].buffer]));
		return promise;
	} else {
		return Promise.reject('magick returned non-zero exit code');
	}
}
