import buffer from '@turf/buffer';
import union from '@turf/union';
import polygonSmooth from '@turf/polygon-smooth';
import explode from '@turf/explode';
import * as helpers from '@turf/helpers';
import booleanContains from '@turf/boolean-contains';
import { Delaunay } from 'd3-delaunay';
import polylabel from 'polylabel';
// eslint-disable-next-line
// @ts-ignore
import { pathRound } from 'd3-path';
import { curveBasis, curveBasisClosed, curveLinear, curveLinearClosed } from 'd3-shape';
import type { Bypass, Country, GameState, LocalizedText, Sector } from './GameState';
import type { MapSettings } from './mapSettings';
import { get } from 'svelte/store';
import { loadEmblem, stellarisDataPromiseStore } from './loadStellarisData';

const SCALE = 100;
const MAX_BORDER_DISTANCE = 700; // systems further from the center than this will not have country borders

export default async function processMapData(gameState: GameState, settings: MapSettings) {
	console.time('generating voronoi');
	const points = Object.values(gameState.galactic_object).map<[number, number]>((go) => [
		go.coordinate.x,
		go.coordinate.y,
	]);
	const minDistanceSquared = 35 ** 2;
	const extraPoints: [number, number][] = [];
	for (let x = -MAX_BORDER_DISTANCE; x <= MAX_BORDER_DISTANCE; x += 10) {
		for (let y = -MAX_BORDER_DISTANCE; y <= MAX_BORDER_DISTANCE; y += 10) {
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
	const voronoi = delaunay.voronoi([
		-MAX_BORDER_DISTANCE,
		-MAX_BORDER_DISTANCE,
		MAX_BORDER_DISTANCE,
		MAX_BORDER_DISTANCE,
	]);
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
	const countryToOwnedSystemIds: Record<string, number[]> = {};
	const countryToSystemPolygon: Record<string, Delaunay.Polygon[]> = {};
	const ownedSystemPoints: helpers.Point[] = [];
	const systemIdToPolygon: Record<string, Delaunay.Polygon> = {};
	const systemIdToCountry: Record<string, number> = {};
	Object.entries(gameState?.galactic_object ?? {}).forEach(([goId, go], i) => {
		const starbase = gameState.starbase_mgr.starbases[go.starbases[0]];
		const ownerId = starbase ? fleetToCountry[gameState.ships[starbase.station].fleet] : null;
		const owner = ownerId != null ? gameState.country[ownerId] : null;
		if (ownerId != null && owner) {
			ownedSystemPoints.push(
				helpers.point(pointToGeoJSON([go.coordinate.x, go.coordinate.y])).geometry,
			);
			if (!countryToOwnedSystemIds[ownerId]) {
				countryToOwnedSystemIds[ownerId] = [];
			}
			countryToOwnedSystemIds[ownerId].push(parseInt(goId));
			systemIdToCountry[parseInt(goId)] = ownerId;

			const polygon = voronoi.cellPolygon(i);
			if (polygon == null) {
				console.warn(`null polygon for system at ${go.coordinate.x},${go.coordinate.y}`);
			} else {
				systemIdToPolygon[goId] = polygon;
				if (!countryToSystemPolygon[ownerId]) {
					countryToSystemPolygon[ownerId] = [];
				}
				countryToSystemPolygon[ownerId].push(polygon);
			}
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
		const textAspectRatio =
			name && settings.countryNames ? getTextAspectRatio(name, settings.countryNamesFont) : 0;
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
					.map((p) => {
						if (settings.labelsAvoidHoles === 'all') return p;
						if (settings.labelsAvoidHoles === 'none')
							return helpers.polygon([p.coordinates[0]]).geometry;
						// settings.labelsAvoidHoles === 'owned'
						return helpers.polygon([
							p.coordinates[0],
							...p.coordinates.slice(1).filter((hole) => {
								const holePolygon = helpers.polygon([hole.slice().reverse()]);
								return ownedSystemPoints.some((ownedSystemPoint) =>
									booleanContains(holePolygon, ownedSystemPoint),
								);
							}),
						]).geometry;
					})
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
									xBuffer: settings.borderWidth / SCALE,
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

		const countrySectors = Object.values(gameState.sectors).filter(
			(sector) => sector.owner?.toString() === countryId,
		);
		const frontierSector: Sector = {
			systems: Object.values(countryToOwnedSystemIds[countryId]).filter((systemId) =>
				countrySectors.every((s) => !s.systems.includes(systemId)),
			),
			owner: parseInt(countryId),
		};
		if (frontierSector.systems.length) {
			countrySectors.push(frontierSector);
		}
		const sectorOuterPolygons = countrySectors.flatMap((sector) => {
			const systemPolygons = sector.systems
				.map((systemId) => systemIdToPolygon[systemId])
				.filter((polygon) => polygon != null);
			if (systemPolygons.length === 0) return [];
			let sectorMultiPolygon: helpers.Feature<helpers.MultiPolygon | helpers.Polygon> =
				helpers.multiPolygon(systemPolygons.map((polygon) => [polygon.map(pointToGeoJSON)]));
			sectorMultiPolygon = union(sectorMultiPolygon, sectorMultiPolygon) as helpers.Feature<
				helpers.MultiPolygon | helpers.Polygon
			>;
			if (sectorMultiPolygon && sectorMultiPolygon.geometry.type === 'Polygon') {
				return [helpers.polygon([sectorMultiPolygon.geometry.coordinates[0]]).geometry];
			} else if (sectorMultiPolygon && sectorMultiPolygon.geometry.type === 'MultiPolygon') {
				return sectorMultiPolygon.geometry.coordinates.map(
					(singlePolygon) => helpers.polygon([singlePolygon[0]]).geometry,
				);
			} else {
				return [];
			}
		});
		const allBorderPoints: Set<string> = new Set(
			explode(outer).features.map((f) => positionToString(f.geometry.coordinates)),
		);
		const sectorOuterPoints: Set<string>[] = sectorOuterPolygons.map(
			(p) => new Set(explode(p).features.map((f) => positionToString(f.geometry.coordinates))),
		);
		// include all border lines in this, so we don't draw sectors border where there is already an external border
		const addedSectorLines: Set<string> = new Set(
			getAllPositionArrays(outer)
				.map((positionArray) =>
					positionArray.map((p, i) => {
						const nextPosition = positionArray[(i + 1) % positionArray.length];
						return [positionToString(p), positionToString(nextPosition)].sort().join(',');
					}),
				)
				.flat(),
		);
		let sectorSegments: helpers.Position[][] = [];
		sectorOuterPolygons.forEach((sectorPolygon, sectorIndex) => {
			let currentSegment: helpers.Position[] = [];
			const firstSegment = currentSegment;
			sectorPolygon.coordinates[0].forEach((pos, posIndex, posArray) => {
				const posString = positionToString(pos);
				const posIsExternal = allBorderPoints.has(posString);
				const posIsLast = posIndex === posArray.length - 1;
				const posSharedSectors = sectorOuterPolygons
					.map((s, i) => i)
					.filter(
						(otherSectorIndex) =>
							otherSectorIndex !== sectorIndex &&
							sectorOuterPoints[otherSectorIndex].has(posString),
					);

				const nextPosIndex = (posIndex + 1) % posArray.length;
				const nextPos = posArray[nextPosIndex];
				const nextPosString = positionToString(nextPos);

				const nextLineString = [posString, nextPosString].sort().join(',');

				if (currentSegment.length) {
					currentSegment.push(pos);
					if (currentSegment.length >= 2) {
						addedSectorLines.add(
							currentSegment
								.slice(currentSegment.length - 2, currentSegment.length)
								.map(positionToString)
								.sort()
								.join(','),
						);
					}
					// close up segment if
					// just added pos is external
					// or shared by 2+ other sectors
					// or next line already added by other segment
					if (
						posIsExternal ||
						posSharedSectors.length >= 2 ||
						(!posIsLast && addedSectorLines.has(nextLineString))
					) {
						sectorSegments.push(currentSegment);
						currentSegment = [];
					}
				}

				if (!currentSegment.length) {
					// no current segment
					// start a new segment, unless next segment already added
					if (!addedSectorLines.has(nextLineString)) {
						currentSegment.push(pos);
					}
				}

				// we've come full circle
				if (
					currentSegment.length &&
					posIsLast &&
					firstSegment.length &&
					positionToString(firstSegment[0]) === posString &&
					firstSegment !== currentSegment
				) {
					// last segment joins up with first segment
					currentSegment.pop();
					firstSegment.unshift(...currentSegment);
					currentSegment = [];
				}
			});
			// push last segment
			if (currentSegment.length) {
				sectorSegments.push(currentSegment);
			}
		});
		// make sure there are no 0 or 1 length segments
		sectorSegments = sectorSegments.filter((segment) => segment.length > 1);
		// extend segments at border, so they reach the border (border can shift from smoothing in next step)
		if (settings.borderSmoothing) {
			sectorSegments.forEach((segment) => {
				if (allBorderPoints.has(positionToString(segment[0]))) {
					segment[0] = getSmoothedPosition(segment[0], outer);
				}
				if (allBorderPoints.has(positionToString(segment[segment.length - 1]))) {
					segment[segment.length - 1] = getSmoothedPosition(segment[segment.length - 1], outer);
				}
			});
		}

		if (settings.borderSmoothing) {
			outer = polygonSmooth(
				union(multiPolygon, multiPolygon) as helpers.Feature<
					helpers.MultiPolygon | helpers.Polygon
				>,
				{ iterations: 2 },
			);
		}
		const inner = buffer(outer, -settings.borderWidth / SCALE, { units: 'degrees' });
		const outerPath = multiPolygonToPath(outer, settings);
		const innerPath = multiPolygonToPath(inner, settings);
		const emblemKey = country.flag?.icon
			? `${country.flag.icon.category}/${country.flag.icon.file}`
			: null;
		return {
			countryId,
			primaryColor,
			secondaryColor,
			outerPath,
			innerPath,
			labelPoints,
			name,
			emblemKey,
			sectorBorders: sectorSegments.map((segment) => segmentToPath(segment, settings)),
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

	const systems = Object.entries(gameState.galactic_object).map(([systemId, system]) => {
		const countryId = systemIdToCountry[parseInt(systemId)];
		const country = countryId != null ? gameState.country[countryId] : null;
		const primaryColor = country?.flag?.colors[0] ?? 'black';
		const secondaryColor = country?.flag?.colors[1] ?? 'black';

		const isOwned = country != null;
		const isColonized = isOwned && Boolean(system.colonies?.length);
		const isSectorCapital = Object.values(gameState.sectors).some((sector) =>
			system.colonies?.includes(sector.local_capital as number),
		);
		const isCountryCapital = system.colonies?.includes(country?.capital as number);
		const x = -system.coordinate.x;
		const y = system.coordinate.y;

		return {
			primaryColor,
			secondaryColor,
			isColonized,
			isSectorCapital,
			isCountryCapital,
			isOwned,
			x,
			y,
		};
	});
	console.timeEnd('processing');

	console.time('loading emblems');
	const emblems = await loadCountryEmblems(Object.values(gameState.country));
	console.timeEnd('loading emblems');

	return { borders, hyperlanesPath, relayHyperlanesPath, emblems, systems };
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

function segmentToPath(segment: helpers.Position[], settings: MapSettings): string {
	const points = segment.map(pointFromGeoJSON);
	const pathContext = pathRound(3);
	const curve = settings.sectorBorderSmoothing ? curveBasis(pathContext) : curveLinear(pathContext);
	curve.lineStart();
	for (const point of points.map(inverseX)) {
		curve.point(...point);
	}
	curve.lineEnd();
	return pathContext.toString();
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
	xBuffer = 0,
}: {
	polygon: helpers.Polygon;
	relativePoint: helpers.Position;
	relativePointType: 'top' | 'bottom' | 'middle';
	ratio: number;
	iterations: number;
	xBuffer?: number;
}) {
	let bestWidth: null | number = null;
	let failedWidth = null;
	let testWidth = 1;
	for (let i = 0; i < iterations; i++) {
		const testRect = makeRect(
			relativePoint,
			relativePointType,
			testWidth + xBuffer * 2,
			testWidth * ratio,
		);
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

function localizeCountryNames(countries: Record<number, Country>) {
	return get(stellarisDataPromiseStore).then(({ loc }) => {
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
			if (!var0) throw new Error();
			return loc['adj_format']
				.replace('adj', localizeText(var0.value, loc))
				.replace('$1$', var1 ? localizeText(var1.value, loc) : '');
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
	const results = await Promise.allSettled(promises);
	return results.reduce<Record<string, string>>((acc, cur, i) => {
		if (cur.status === 'fulfilled') {
			acc[keys[i]] = cur.value;
		} else {
			console.warn('failed to load emblem', keys[i]);
		}
		return acc;
	}, {});
}

const magickImport = '/magickApi.js';
async function convertDds(key: string, content: Uint8Array) {
	const result = await (
		await import(magickImport /* @vite-ignore */)
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

const measureTextContext = document
	.createElement('canvas')
	.getContext('2d') as CanvasRenderingContext2D;
function getTextAspectRatio(text: string, fontFamily: string) {
	measureTextContext.font = `10px '${fontFamily}'`;
	return 10 / measureTextContext.measureText(text).width;
}

function positionToString(p: helpers.Position): string {
	return `${p[0]},${p[1]}`;
}

function getAllPositionArrays(
	featureCollection: helpers.FeatureCollection<helpers.Polygon | helpers.MultiPolygon>,
) {
	const allPositionArrays = featureCollection.features
		.map<helpers.Position[][]>((f) => {
			const geometry = f.geometry;
			if (geometry.type === 'Polygon') {
				return geometry.coordinates;
			} else {
				return geometry.coordinates.flat();
			}
		})
		.flat();
	return allPositionArrays;
}

function getSmoothedPosition(
	position: helpers.Position,
	featureCollection: helpers.FeatureCollection<helpers.Polygon | helpers.MultiPolygon>,
) {
	const allPositionArrays = getAllPositionArrays(featureCollection);
	const positionArray = allPositionArrays.find((array) =>
		array.some((p) => p[0] === position[0] && p[1] === position[1]),
	);
	if (positionArray) {
		const positionIndex = positionArray.findIndex(
			(p) => p[0] === position[0] && p[1] === position[1],
		);

		const nextIndex = (positionIndex + 1) % positionArray.length;
		const next = positionArray[nextIndex];
		const nextDx = next[0] - position[0];
		const nextDy = next[1] - position[1];

		const prevIndex = (positionIndex + positionArray.length - 1) % positionArray.length;
		const prev = positionArray[prevIndex];
		const prevDx = prev[0] - position[0];
		const prevDy = prev[1] - position[1];

		const smoothedSegment = [
			[position[0] + prevDx * 0.25, position[1] + prevDy * 0.25],
			[position[0] + nextDx * 0.25, position[1] + nextDy * 0.25],
		];
		const smoothedSegmentMidpoint = [
			(smoothedSegment[0][0] + smoothedSegment[1][0]) / 2,
			(smoothedSegment[0][1] + smoothedSegment[1][1]) / 2,
		];
		return smoothedSegmentMidpoint;
	} else {
		console.warn('getSmoothedPosition failed: could not find position in geojson');
		return position;
	}
}
