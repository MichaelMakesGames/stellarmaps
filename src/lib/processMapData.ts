import buffer from '@turf/buffer';
import turfCircle from '@turf/circle';
import difference from '@turf/difference';
import intersect from '@turf/intersect';
import union from '@turf/union';
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
import { countryOptions, type MapSettings } from './mapSettings';
import { get } from 'svelte/store';
import { loadEmblem, stellarisDataPromiseStore } from './loadStellarisData';
import { getLuminance, getLuminanceContrast, isDefined, parseNumberEntry } from './utils';
import { interpolateBasis } from 'd3-interpolate';
import Color from 'color';

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
	if (!settings.circularGalaxyBorders) {
		points.push(...extraPoints);
	}
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
	countryOptions.set(
		Object.entries(countryNames)
			.map(([id, name]) => ({ id, name }))
			.filter(({ id }) => gameState.country[parseInt(id)]?.type === 'default'),
	);
	console.timeEnd('localizing country names');

	console.time('processing system ownership');
	const fleetToCountry: Record<string, number> = {};
	Object.entries(gameState.country).forEach(([countryId, country]) => {
		country.fleets_manager?.owned_fleets?.forEach((owned_fleet) => {
			fleetToCountry[owned_fleet.fleet] = parseFloat(countryId);
		});
	});
	const countryToOwnedSystemIds: Record<string, number[]> = {};
	const countryToSystemPolygons: Record<string, Delaunay.Polygon[]> = {};
	const unionLeaderToSystemPolygons: Record<string, Delaunay.Polygon[]> = {};
	const unionLeaderToUnionMembers: Record<number, Set<number>> = {};
	const ownedSystemPoints: helpers.Point[] = [];
	const systemIdToPolygon: Record<string, Delaunay.Polygon> = {};
	const systemIdToCountry: Record<string, number | undefined> = {};
	const systemIdToUnionLeader: Record<string, number | undefined> = {};
	Object.entries(gameState?.galactic_object ?? {}).forEach(([goId, go], i) => {
		const starbase = gameState.starbase_mgr.starbases[go.starbases[0]];
		const ownerId = starbase ? fleetToCountry[gameState.ships[starbase.station].fleet] : null;
		const owner = ownerId != null ? gameState.country[ownerId] : null;
		const polygon = voronoi.cellPolygon(i);
		systemIdToPolygon[goId] = polygon;
		if (ownerId != null && owner) {
			const unionLeaderId = getUnionLeaderId(ownerId, gameState, settings);
			ownedSystemPoints.push(
				helpers.point(pointToGeoJSON([go.coordinate.x, go.coordinate.y])).geometry,
			);
			if (!countryToOwnedSystemIds[ownerId]) {
				countryToOwnedSystemIds[ownerId] = [];
			}
			countryToOwnedSystemIds[ownerId].push(parseInt(goId));
			systemIdToCountry[parseInt(goId)] = ownerId;
			systemIdToUnionLeader[parseInt(goId)] = unionLeaderId;

			if (polygon == null) {
				console.warn(`null polygon for system at ${go.coordinate.x},${go.coordinate.y}`);
			} else {
				if (!countryToSystemPolygons[ownerId]) {
					countryToSystemPolygons[ownerId] = [];
				}
				countryToSystemPolygons[ownerId].push(polygon);
				if (!unionLeaderToSystemPolygons[unionLeaderId]) {
					unionLeaderToSystemPolygons[unionLeaderId] = [];
				}
				unionLeaderToSystemPolygons[unionLeaderId].push(polygon);
				if (!unionLeaderToUnionMembers[unionLeaderId]) {
					unionLeaderToUnionMembers[unionLeaderId] = new Set();
				}
				unionLeaderToUnionMembers[unionLeaderId].add(ownerId);
			}
		}
	});
	console.timeEnd('processing system ownership');

	console.time('processing circular galaxy borders');
	const { galaxyBorderCircles, galaxyBorderCirclesGeoJSON } = processCircularGalaxyBorders(
		gameState,
		settings,
	);
	console.timeEnd('processing circular galaxy borders');

	console.time('processing terra incognita');
	const terraIncognitaPerspectiveCountryId =
		settings.terraIncognitaPerspectiveCountry === 'player'
			? gameState.player?.filter((p) => gameState.country[p?.country])[0]?.country
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
	const knownCounties = new Set(
		terraIncognitaPerspectiveCountryId == null
			? Object.keys(gameState.country).map((id) => parseInt(id))
			: getGameStateValueAsArray(terraIncognitaPerspectiveCountry?.relations_manager?.relation)
					.filter((relation) => relation.communications)
					.map((relation) => relation.country),
	);
	if (terraIncognitaPerspectiveCountryId != null)
		knownCounties.add(terraIncognitaPerspectiveCountryId);
	const terraIncognitaGeoJSON = joinSystemPolygons(
		unknownSystems.map((systemId) => systemIdToPolygon[systemId]),
		galaxyBorderCirclesGeoJSON,
	);
	const terraIncognitaPath =
		terraIncognitaGeoJSON == null
			? ''
			: multiPolygonToPath(helpers.featureCollection([terraIncognitaGeoJSON]), settings);
	console.timeEnd('processing terra incognita');

	console.time('processing unowned hyperlanes');
	const relayMegastructures = new Set(
		Object.values(gameState.bypasses)
			.filter(
				(bypass): bypass is Bypass & Required<Pick<Bypass, 'owner'>> =>
					bypass.type === 'relay_bypass' && bypass.owner?.type === 6,
			)
			.map((bypass) => bypass.owner.id),
	);
	const { hyperlanesPath: unownedHyperlanesPath, relayHyperlanesPath: unownedRelayHyperlanesPath } =
		createHyperlanePaths(gameState, relayMegastructures, systemIdToUnionLeader, null);
	console.timeEnd('processing unowned hyperlanes');

	console.time('processing labels');
	const labels = Object.entries(countryToSystemPolygons).map(([countryId, systemPolygons]) => {
		const name = countryNames[countryId] ?? '';
		const country = gameState.country[parseInt(countryId)];
		const labelSearchAreaGeoJSON = joinSystemPolygons(systemPolygons, galaxyBorderCirclesGeoJSON);

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
		const labelPoints =
			searchAspectRatio && labelSearchAreaGeoJSON != null
				? getPolygons(labelSearchAreaGeoJSON)
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
		const emblemKey = country.flag?.icon
			? `${country.flag.icon.category}/${country.flag.icon.file}`
			: null;
		return {
			labelPoints,
			name,
			emblemKey,
			isUnionLeader: isUnionLeader(parseInt(countryId), gameState, settings),
			isKnown: knownCounties.has(parseInt(countryId)),
		};
	});
	console.timeEnd('processing labels');

	console.time('processing borders');
	const borders = Object.entries(unionLeaderToSystemPolygons)
		.map(parseNumberEntry)
		.map(([countryId, systemPolygons]) => {
			const colors = getCountryColors(countryId, gameState, settings);
			const primaryColor = colors?.[0] ?? 'black';
			const secondaryColor = colors?.[1] ?? 'black';
			const outerBorderGeoJSON = joinSystemPolygons(systemPolygons, galaxyBorderCirclesGeoJSON);
			if (!outerBorderGeoJSON) {
				console.warn('outerBorderGeoJSON failed');
				return {
					countryId,
					primaryColor,
					secondaryColor,
					outerPath: '',
					innerPath: '',
					sectorBorders: [],
				};
			}

			const countrySectors = Object.values(gameState.sectors).filter(
				(sector) =>
					sector.owner != null && getUnionLeaderId(sector.owner, gameState, settings) === countryId,
			);
			for (const unionMemberId of unionLeaderToUnionMembers[countryId].values()) {
				const frontierSector: Sector = {
					systems: Object.values(countryToOwnedSystemIds[unionMemberId]).filter((systemId) =>
						countrySectors.every((s) => !s.systems.includes(systemId)),
					),
					owner: unionMemberId,
				};
				if (frontierSector.systems.length) {
					countrySectors.push(frontierSector);
				}
			}
			const sectorOuterPolygons = countrySectors.flatMap((sector) => {
				const systemPolygons = sector.systems
					.map((systemId) => systemIdToPolygon[systemId])
					.filter((polygon) => polygon != null);
				const sectorGeoJSON = joinSystemPolygons(systemPolygons, galaxyBorderCirclesGeoJSON);
				if (sectorGeoJSON && sectorGeoJSON.geometry.type === 'Polygon') {
					return [helpers.polygon([sectorGeoJSON.geometry.coordinates[0]]).geometry];
				} else if (sectorGeoJSON && sectorGeoJSON.geometry.type === 'MultiPolygon') {
					return sectorGeoJSON.geometry.coordinates.map(
						(singlePolygon) => helpers.polygon([singlePolygon[0]]).geometry,
					);
				} else {
					return [];
				}
			});

			const unionMemberOuterPolygons = Array.from(unionLeaderToUnionMembers[countryId].values())
				.map((unionMemberId) => {
					const systemPolygons = countryToOwnedSystemIds[unionMemberId]
						.map((systemId) => systemIdToPolygon[systemId])
						.filter((polygon) => polygon != null);
					const unionMemberGeoJSON = joinSystemPolygons(systemPolygons, galaxyBorderCirclesGeoJSON);
					if (unionMemberGeoJSON && unionMemberGeoJSON.geometry.type === 'Polygon') {
						return [helpers.polygon([unionMemberGeoJSON.geometry.coordinates[0]]).geometry];
					} else if (unionMemberGeoJSON && unionMemberGeoJSON.geometry.type === 'MultiPolygon') {
						return unionMemberGeoJSON.geometry.coordinates.map(
							(singlePolygon) => helpers.polygon([singlePolygon[0]]).geometry,
						);
					} else {
						return [];
					}
				})
				.flat();

			const unionMemberBorderLines: Set<string> = new Set();
			getAllPositionArrays(
				helpers.featureCollection(unionMemberOuterPolygons.map((poly) => helpers.feature(poly))),
			).forEach((positionArray) =>
				positionArray.forEach((p, i) => {
					const nextPosition = positionArray[(i + 1) % positionArray.length];
					unionMemberBorderLines.add(
						[positionToString(p), positionToString(nextPosition)].sort().join(','),
					);
				}),
			);

			const allBorderPoints: Set<string> = new Set(
				explode(outerBorderGeoJSON).features.map((f) => positionToString(f.geometry.coordinates)),
			);
			const sectorOuterPoints: Set<string>[] = sectorOuterPolygons.map(
				(p) => new Set(explode(p).features.map((f) => positionToString(f.geometry.coordinates))),
			);
			// include all border lines in this, so we don't draw sectors border where there is already an external border
			const addedSectorLines: Set<string> = new Set(
				getAllPositionArrays(outerBorderGeoJSON)
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
			// check for union border segments
			const unionBorderSegments = sectorSegments.filter((segment) => {
				const firstLineString = [positionToString(segment[0]), positionToString(segment[1])]
					.sort()
					.join(',');
				return unionMemberBorderLines.has(firstLineString);
			});
			// extend segments at border, so they reach the border (border can shift from smoothing in next step)
			if (settings.borderSmoothing) {
				sectorSegments.forEach((segment) => {
					if (allBorderPoints.has(positionToString(segment[0]))) {
						segment[0] = getSmoothedPosition(segment[0], outerBorderGeoJSON);
					}
					if (allBorderPoints.has(positionToString(segment[segment.length - 1]))) {
						segment[segment.length - 1] = getSmoothedPosition(
							segment[segment.length - 1],
							outerBorderGeoJSON,
						);
					}
				});
			}

			let smoothedOuterBorderGeoJSON = outerBorderGeoJSON;
			if (settings.borderSmoothing) {
				smoothedOuterBorderGeoJSON = smoothGeojson(outerBorderGeoJSON, 2);
			}
			const smoothedInnerBorderGeoJSON = buffer(
				smoothedOuterBorderGeoJSON,
				-settings.borderWidth / SCALE,
				{ units: 'degrees' },
			);
			const outerPath = multiPolygonToPath(smoothedOuterBorderGeoJSON, settings);
			const innerPath = multiPolygonToPath(smoothedInnerBorderGeoJSON, settings);
			const { hyperlanesPath, relayHyperlanesPath } = createHyperlanePaths(
				gameState,
				relayMegastructures,
				systemIdToUnionLeader,
				countryId,
			);
			return {
				countryId,
				primaryColor,
				secondaryColor,
				outerPath,
				innerPath,
				hyperlanesPath,
				relayHyperlanesPath,
				sectorBorders: sectorSegments.map((segment) => ({
					path: segmentToPath(segment, settings),
					isUnionBorder: unionBorderSegments.includes(segment),
				})),
				isKnown: knownCounties.has(countryId),
			};
		});
	console.timeEnd('processing borders');

	console.time('processing system icons');
	const systems = Object.entries(gameState.galactic_object).map(([systemId, system]) => {
		const countryId = systemIdToCountry[parseInt(systemId)];
		const country = countryId != null ? gameState.country[countryId] : null;
		const colors = countryId != null ? getCountryColors(countryId, gameState, settings) : null;
		const primaryColor = colors?.[0] ?? 'black';
		const secondaryColor = colors?.[1] ?? 'black';

		const isOwned = country != null;
		const isColonized = isOwned && Boolean(system.colonies?.length);
		const isSectorCapital = Object.values(gameState.sectors).some((sector) =>
			system.colonies?.includes(sector.local_capital as number),
		);
		const isCountryCapital = system.colonies?.includes(country?.capital as number);
		const x = -system.coordinate.x;
		const y = system.coordinate.y;

		const ownerIsKnown = countryId != null && knownCounties.has(countryId);
		const systemIsKnown = knownSystems.has(parseInt(systemId));

		return {
			primaryColor,
			secondaryColor,
			isColonized,
			isSectorCapital,
			isCountryCapital,
			isOwned,
			ownerIsKnown,
			systemIsKnown,
			x,
			y,
		};
	});
	console.timeEnd('processing system icons');

	console.time('loading emblems');
	const emblems = await loadCountryEmblems(Object.values(gameState.country));
	console.timeEnd('loading emblems');

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

function multiPolygonToPath(
	geoJSON:
		| helpers.FeatureCollection<helpers.MultiPolygon | helpers.Polygon, helpers.Properties>
		| helpers.Feature<helpers.MultiPolygon | helpers.Polygon, helpers.Properties>,
	settings: MapSettings,
) {
	const features = geoJSON.type === 'FeatureCollection' ? geoJSON.features : [geoJSON];
	const coordinates = features.flatMap((feature) =>
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
	geojson:
		| helpers.FeatureCollection<helpers.MultiPolygon | helpers.Polygon>
		| helpers.Feature<helpers.MultiPolygon | helpers.Polygon>,
): helpers.Polygon[] {
	const features = geojson.type === 'FeatureCollection' ? geojson.features : [geojson];
	return features.flatMap((feature) => {
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
			console.warn('localization failed', text);
			return 'LOCALIZATION FAILED';
		}
	} else if (text.key === '%ADJ%') {
		try {
			const var0 = text.variables?.[0];
			if (!var0 || !var0.value.variables) throw new Error();
			const adj = loc[var0.value.key] ?? var0.value.key;
			if (adj.includes('$1$')) {
				return localizeText(var0.value, loc);
			} else {
				return loc['adj_format']
					.replace('adj', adj)
					.replace('$1$', localizeText(var0.value.variables[0].value, loc));
			}
		} catch {
			console.warn('localization failed', text);
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
	return `${p[0].toFixed(3)},${p[1].toFixed(3)}`;
}

function getAllPositionArrays(
	geoJSON:
		| helpers.FeatureCollection<helpers.Polygon | helpers.MultiPolygon>
		| helpers.Feature<helpers.Polygon | helpers.MultiPolygon>,
) {
	const features = geoJSON.type === 'FeatureCollection' ? geoJSON.features : [geoJSON];
	const allPositionArrays = features
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
	geoJSON:
		| helpers.FeatureCollection<helpers.Polygon | helpers.MultiPolygon>
		| helpers.Feature<helpers.Polygon | helpers.MultiPolygon>,
) {
	const allPositionArrays = getAllPositionArrays(geoJSON);
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

function isUnionLeader(countryId: number, gameState: GameState, settings: MapSettings) {
	const country = gameState.country[countryId];
	const federation = country.federation != null ? gameState.federation[country.federation] : null;
	if (settings.unionFederations !== 'off' && settings.unionSubjects !== 'off') {
		if (federation) {
			return federation.leader === countryId;
		} else {
			return Boolean(country.subjects?.length);
		}
	} else if (settings.unionFederations !== 'off' && federation) {
		return federation.leader === countryId;
	} else if (settings.unionSubjects !== 'off') {
		return Boolean(country.subjects?.length);
	} else {
		return false;
	}
}

function getUnionLeaderId(countryId: number, gameState: GameState, settings: MapSettings): number {
	const country = gameState.country[countryId];
	const overlordId = country.overlord;
	const overlord = overlordId != null ? gameState.country[overlordId] : null;
	const federation = country.federation != null ? gameState.federation[country.federation] : null;
	const overlordFederation =
		overlord?.federation != null ? gameState.federation[overlord?.federation] : null;
	if (
		settings.unionFederations === 'joinedBorders' &&
		settings.unionSubjects === 'joinedBorders' &&
		overlordFederation
	) {
		return overlordFederation.leader;
	} else if (settings.unionFederations === 'joinedBorders' && federation) {
		return federation.leader;
	} else if (settings.unionSubjects === 'joinedBorders' && overlord && overlordId != null) {
		return overlordId;
	} else {
		return countryId;
	}
}

function getCountryColors(countryId: number, gameState: GameState, settings: MapSettings) {
	const country = gameState.country[countryId];
	const overlordId = country.overlord;
	const overlord = overlordId != null ? gameState.country[overlordId] : null;
	const federation = country.federation != null ? gameState.federation[country.federation] : null;
	const overlordFederation =
		overlord?.federation != null ? gameState.federation[overlord?.federation] : null;
	if (
		settings.unionFederations !== 'off' &&
		settings.unionSubjects !== 'off' &&
		overlordFederation
	) {
		return gameState.country[overlordFederation.leader].flag?.colors;
	} else if (settings.unionFederations !== 'off' && federation) {
		return gameState.country[federation.leader].flag?.colors;
	} else if (settings.unionSubjects !== 'off' && overlord) {
		return overlord.flag?.colors;
	} else {
		return country.flag?.colors;
	}
}

function smoothGeojson<T extends GeoJSON.GeoJSON>(geojson: T, iterations: number): T {
	if (geojson.type === 'FeatureCollection') {
		return {
			...geojson,
			features: geojson.features.map((f) => smoothGeojson(f, iterations)),
		};
	} else if (geojson.type === 'Feature') {
		return {
			...geojson,
			geometry: smoothGeojson(geojson.geometry, iterations),
		};
	} else if (geojson.type === 'GeometryCollection') {
		return {
			...geojson,
			geometries: geojson.geometries.map((g) => smoothGeojson(g, iterations)),
		};
	} else if (geojson.type === 'Point' || geojson.type === 'MultiPoint') {
		return geojson;
	} else if (geojson.type === 'LineString') {
		return {
			...geojson,
			coordinates: smoothPositionArray(geojson.coordinates, iterations, false),
		};
	} else if (geojson.type === 'MultiLineString') {
		return {
			...geojson,
			coordinates: geojson.coordinates.map((lineString) =>
				smoothPositionArray(lineString, iterations, false),
			),
		};
	} else if (geojson.type === 'Polygon') {
		return {
			...geojson,
			coordinates: geojson.coordinates.map((ring) => smoothPositionArray(ring, iterations, true)),
		};
	} else if (geojson.type === 'MultiPolygon') {
		return {
			...geojson,
			coordinates: geojson.coordinates.map((polygon) =>
				polygon.map((ring) => smoothPositionArray(ring, iterations, true)),
			),
		};
	}
	return geojson;
}

function smoothPositionArray(
	positionArray: helpers.Position[],
	iterations: number,
	loops: boolean,
): helpers.Position[] {
	let copy = positionArray.slice();
	if (
		loops &&
		(copy[0][0] !== copy[copy.length - 1][0] || copy[0][1] !== copy[copy.length - 1][1])
	) {
		copy.push(copy[0]);
	}
	for (let i = 0; i < iterations; i++) {
		copy = smoothPositionArrayIteration(copy, loops);
	}
	return copy;
}

function smoothPositionArrayIteration(
	positionArray: helpers.Position[],
	loops: boolean,
): helpers.Position[] {
	const smoothed = positionArray.flatMap((position, index) => {
		if ((index === 0 || index === positionArray.length - 1) && !loops) {
			return [position];
		} else {
			const nextIndex = (index + 1) % positionArray.length;
			const next = positionArray[nextIndex];
			const nextDx = next[0] - position[0];
			const nextDy = next[1] - position[1];

			const prevIndex = (index + positionArray.length - 1) % positionArray.length;
			const prev = positionArray[prevIndex];
			const prevDx = prev[0] - position[0];
			const prevDy = prev[1] - position[1];

			const smoothedSegment: helpers.Position[] = [
				[position[0] + prevDx * 0.25, position[1] + prevDy * 0.25],
				[position[0] + nextDx * 0.25, position[1] + nextDy * 0.25],
			];
			if (index === positionArray.length - 1) {
				return [smoothedSegment[0]];
			} else {
				return smoothedSegment;
			}
		}
	});
	if (loops) {
		// fix floating point errors for properly closing ring
		smoothed[smoothed.length - 1] = smoothed[0];
	}
	return smoothed;
}

function getGameStateValueAsArray<T>(
	value: null | undefined | Record<string, never> | T | T[],
): T[] {
	if (value == null) return [];
	if (Array.isArray(value)) return value;
	if (typeof value === 'object' && Object.keys(value).length === 0) return [];
	return [value as T];
}

const CIRCLE_OUTER_PADDING = 20;
const CIRCLE_INNER_PADDING = 10;
const OUTLIER_DISTANCE = 30;
const OUTLIER_RADIUS = 15;
const STARBURST_NUM_SLICES = 12;
const STARBURST_LINES_PER_SLICE = 50;
const STARBURST_SLICE_ANGLE = (Math.PI * 2) / STARBURST_NUM_SLICES;
const ONE_DEGREE = Math.PI / 180;

function processCircularGalaxyBorders(gameState: GameState, settings: MapSettings) {
	if (!settings.circularGalaxyBorders) {
		return {
			galaxyBorderCircles: [],
			galaxyBorderCirclesGeoJSON: null,
		};
	}

	const clusters: {
		systems: Set<number>;
		outliers: Set<number>;
		bBox: { xMin: number; xMax: number; yMin: number; yMax: number };
	}[] = [];

	for (const [goId, go] of Object.entries(gameState.galactic_object).map(parseNumberEntry)) {
		if (clusters.some((cluster) => cluster.systems.has(goId))) continue;
		const cluster: (typeof clusters)[0] = {
			systems: new Set<number>([goId]),
			outliers: new Set<number>(),
			bBox: {
				xMin: go.coordinate.x,
				xMax: go.coordinate.x,
				yMin: go.coordinate.y,
				yMax: go.coordinate.y,
			},
		};
		const edge = go.hyperlane?.map((hyperlane) => hyperlane.to) ?? [];
		const edgeSet = new Set(edge);
		while (edge.length > 0) {
			const nextId = edge.pop();
			if (nextId == null) break; // this shouldn't be possible, here for type inference
			edgeSet.delete(nextId);
			const next = gameState.galactic_object[nextId];
			if (next && !cluster.systems.has(nextId)) {
				cluster.systems.add(nextId);
				const nextHyperlanes = getGameStateValueAsArray(next.hyperlane);
				const isOutlier = nextHyperlanes.length === 1 && nextHyperlanes.length > OUTLIER_DISTANCE;
				if (isOutlier) {
					cluster.outliers.add(nextId);
				} else {
					if (next.coordinate.x < cluster.bBox.xMin) cluster.bBox.xMin = next.coordinate.x;
					if (next.coordinate.x > cluster.bBox.xMax) cluster.bBox.xMax = next.coordinate.x;
					if (next.coordinate.y < cluster.bBox.yMin) cluster.bBox.yMin = next.coordinate.y;
					if (next.coordinate.y > cluster.bBox.yMax) cluster.bBox.yMax = next.coordinate.y;
				}
				for (const hyperlane of nextHyperlanes) {
					if (!cluster.systems.has(hyperlane.to) && !edgeSet.has(hyperlane.to)) {
						edge.push(hyperlane.to);
						edgeSet.add(hyperlane.to);
					}
				}
			}
		}
		clusters.push(cluster);
	}

	let starburstGeoJSON: null | helpers.Feature<helpers.Polygon | helpers.MultiPolygon> = null;
	const mainCluster = clusters.find((cluster) =>
		clusters.every((otherCluster) => cluster.systems.size >= otherCluster.systems.size),
	);
	if (mainCluster && gameState.galaxy.shape === 'starburst') {
		let outerRadii: number[] = [];
		let innerRadii: number[] = [];
		for (let i = 0; i < STARBURST_NUM_SLICES; i++) {
			const minAngle = STARBURST_SLICE_ANGLE * i - ONE_DEGREE;
			const maxAngle = STARBURST_SLICE_ANGLE * (i + 1) + ONE_DEGREE;
			const [minR, maxR] = getMinMaxSystemRadii(
				Array.from(mainCluster.systems).filter((id) => {
					const system = gameState.galactic_object[id];
					let systemAngle = Math.atan2(system.coordinate.y, system.coordinate.x);
					if (systemAngle < 0) systemAngle = Math.PI * 2 + systemAngle;
					return (
						!mainCluster.outliers.has(id) && systemAngle >= minAngle && systemAngle <= maxAngle
					);
				}),
				0,
				0,
				gameState,
			);
			outerRadii.push(maxR);
			innerRadii.push(minR);
		}

		const outerStartIndex = findStarburstStartIndex(outerRadii);
		const outerStartAngle = outerStartIndex * STARBURST_SLICE_ANGLE;
		for (let i = 0; i < outerStartIndex; i++) {
			outerRadii.push(outerRadii.shift() as number);
		}
		outerRadii = smoothRadii(outerRadii, outerRadii, [], 100);
		const interpolateOuterRadii = interpolateBasis(outerRadii);
		starburstGeoJSON = makeStarburstPolygon(
			outerStartAngle,
			interpolateOuterRadii,
			CIRCLE_OUTER_PADDING,
		);

		const innerStartIndex = findStarburstStartIndex(innerRadii);
		const innerStartAngle = innerStartIndex * STARBURST_SLICE_ANGLE;
		for (let i = 0; i < innerStartIndex; i++) {
			innerRadii.push(innerRadii.shift() as number);
		}
		innerRadii = smoothRadii(innerRadii, [], innerRadii, 100);
		// don't cut out inner shape if the core is too small (eg has gigastructures core)
		if (innerRadii.every((r) => r > CIRCLE_INNER_PADDING)) {
			const interpolateInnerRadii = interpolateBasis(innerRadii);
			starburstGeoJSON = difference(
				starburstGeoJSON,
				makeStarburstPolygon(innerStartAngle, interpolateInnerRadii, -CIRCLE_INNER_PADDING),
			);
		}
	}

	const galaxyBorderCircles = clusters.flatMap((cluster) => {
		const isStarburstCluster = cluster === mainCluster && gameState.galaxy.shape === 'starburst';
		const cx = (cluster.bBox.xMin + cluster.bBox.xMax) / 2;
		const cy = (cluster.bBox.yMin + cluster.bBox.yMax) / 2;
		const [minR, maxR] = getMinMaxSystemRadii(
			Array.from(cluster.systems).filter((id) => !cluster.outliers.has(id)),
			cx,
			cy,
			gameState,
		);
		const clusterCircles = [
			{
				cx,
				cy,
				r: maxR,
				type: 'outer',
			},
			{
				cx,
				cy,
				r: maxR + CIRCLE_OUTER_PADDING,
				type: 'outer-padded',
			},
		];
		if (minR > 0) {
			clusterCircles.push({ cx, cy, r: minR, type: 'inner' });
		}
		if (minR > CIRCLE_OUTER_PADDING) {
			clusterCircles.push({
				cx,
				cy,
				r: minR - CIRCLE_INNER_PADDING,
				type: 'inner-padded',
			});
		}
		// inner/outer borders are specially handled for starburst
		// we only want the following outlier circles for starburst
		if (isStarburstCluster) clusterCircles.length = 0;
		clusterCircles.push(
			...Array.from(cluster.outliers).map((outlierId) => ({
				cx: gameState.galactic_object[outlierId].coordinate.x,
				cy: gameState.galactic_object[outlierId].coordinate.y,
				r: OUTLIER_RADIUS,
				type: 'outlier',
			})),
		);
		return clusterCircles;
	});
	let galaxyBorderCirclesGeoJSON: null | helpers.Feature<helpers.Polygon | helpers.MultiPolygon> =
		starburstGeoJSON;
	for (const circle of galaxyBorderCircles.filter((circle) => circle.type === 'outer-padded')) {
		const polygon = turfCircle(pointToGeoJSON([circle.cx, circle.cy]), circle.r / SCALE, {
			units: 'degrees',
			steps: Math.ceil(circle.r),
		});
		if (galaxyBorderCirclesGeoJSON == null) {
			galaxyBorderCirclesGeoJSON = polygon;
		} else {
			galaxyBorderCirclesGeoJSON = union(galaxyBorderCirclesGeoJSON, polygon);
		}
	}
	for (const circle of galaxyBorderCircles.filter((circle) => circle.type === 'inner-padded')) {
		const polygon = turfCircle(pointToGeoJSON([circle.cx, circle.cy]), circle.r / SCALE, {
			units: 'degrees',
			steps: Math.ceil(circle.r),
		});
		if (galaxyBorderCirclesGeoJSON != null) {
			galaxyBorderCirclesGeoJSON = difference(galaxyBorderCirclesGeoJSON, polygon);
		}
	}
	for (const circle of galaxyBorderCircles.filter((circle) => circle.type === 'outlier')) {
		const polygon = turfCircle(pointToGeoJSON([circle.cx, circle.cy]), circle.r / SCALE, {
			units: 'degrees',
			steps: Math.ceil(circle.r),
		});
		if (galaxyBorderCirclesGeoJSON == null) {
			galaxyBorderCirclesGeoJSON = polygon;
		} else {
			galaxyBorderCirclesGeoJSON = union(galaxyBorderCirclesGeoJSON, polygon);
		}
	}
	return { galaxyBorderCircles, galaxyBorderCirclesGeoJSON };
}

function getMinMaxSystemRadii(
	systemIds: number[],
	cx: number,
	cy: number,
	gameState: GameState,
): [number, number] {
	const sortedRadiusesSquared = systemIds
		.map((id) => {
			const system = gameState.galactic_object[id];
			return (cx - system.coordinate.x) ** 2 + (cy - system.coordinate.y) ** 2;
		})
		.sort((a, b) => a - b);
	return [
		Math.sqrt(sortedRadiusesSquared[0]),
		Math.sqrt(sortedRadiusesSquared[sortedRadiusesSquared.length - 1]),
	];
}

function smoothRadii(radii: number[], minimums: number[], maximums: number[], passes: number) {
	let newRadii = radii;
	let passesDone = 0;
	while (passesDone < passes) {
		newRadii = smoothRadiiPass(newRadii, minimums, maximums);
		passesDone++;
	}
	return newRadii;
}

function smoothRadiiPass(radii: number[], minimums: number[], maximums: number[]) {
	const newRadii: number[] = [];
	radii.forEach((radius, i) => {
		let proposedValue = radius;
		if (i === 0) {
			const next = radii[i + 1];
			const nextNext = radii[i + 2];
			const slope = next - radius;
			const nextSlope = nextNext - next;
			if (Math.abs(nextSlope) < Math.abs(slope)) {
				proposedValue = next - nextSlope;
			}
		} else if (i === radii.length - 1) {
			const prev = radii[i - 1];
			const prevPrev = radii[i - 2];
			const slope = radius - prev;
			const prevSlope = prev - prevPrev;
			if (Math.abs(prevSlope) < Math.abs(slope)) {
				proposedValue = prev + prevSlope;
			}
		} else {
			const prev = radii[i - 1];
			const next = radii[i + 1];
			proposedValue = (prev + next) / 2;
		}
		const min = minimums[i];
		const max = maximums[i];
		if ((min == null || proposedValue >= min) && (max == null || proposedValue <= max)) {
			newRadii.push(proposedValue);
		} else {
			newRadii.push(radius);
		}
	});
	return newRadii;
}

function findStarburstStartIndex(radii: number[]) {
	const startRadius = radii.slice().sort((a, b) => {
		const aPrevSliceIndex = (radii.indexOf(a) - 1 + radii.length) % radii.length;
		const aDiff = a - radii[aPrevSliceIndex];
		const bPrevSliceIndex = (radii.indexOf(b) - 1 + radii.length) % radii.length;
		const bDiff = b - radii[bPrevSliceIndex];
		return aDiff - bDiff;
	})[0];
	return radii.indexOf(startRadius);
}

function makeStarburstPolygon(
	startAngle: number,
	interpolateRadii: (n: number) => number,
	padding: number,
): helpers.Feature<helpers.Polygon> {
	const positions: helpers.Position[] = [];
	for (let i = 0; i < STARBURST_NUM_SLICES; i++) {
		const sliceIndex = i;
		const fromAngle = startAngle + STARBURST_SLICE_ANGLE * sliceIndex;
		for (let j = 0; j < STARBURST_LINES_PER_SLICE + (i === STARBURST_NUM_SLICES - 1 ? 1 : 0); j++) {
			const angle = fromAngle + (STARBURST_SLICE_ANGLE / STARBURST_LINES_PER_SLICE) * j;
			const radius =
				(interpolateRadii(
					i / STARBURST_NUM_SLICES + j / STARBURST_LINES_PER_SLICE / STARBURST_NUM_SLICES,
				) +
					padding) /
				SCALE;
			positions.push([Math.cos(angle) * radius, Math.sin(angle) * radius]);
		}
	}
	positions.push(positions[0]);
	return helpers.polygon([positions]);
}

function joinSystemPolygons(
	systemPolygons: (Delaunay.Polygon | null | undefined)[],
	galaxyBorderCirclesGeoJSON: null | helpers.Feature<helpers.Polygon | helpers.MultiPolygon>,
) {
	const nonNullishPolygons = systemPolygons.filter(isDefined);
	if (!nonNullishPolygons.length) return null;
	const invalidMultiPolygon = helpers.multiPolygon(
		nonNullishPolygons.map((polygon) => [polygon.map(pointToGeoJSON)]),
	);
	const polygonOrMultiPolygon = union(invalidMultiPolygon, invalidMultiPolygon);
	if (polygonOrMultiPolygon && galaxyBorderCirclesGeoJSON) {
		return intersect(polygonOrMultiPolygon, galaxyBorderCirclesGeoJSON);
	} else {
		return polygonOrMultiPolygon;
	}
}

export interface ColorConfig {
	value: string;
	opacity?: number;
	minimumContrast?: number;
	background?: ColorConfig;
}

export function resolveColor(
	mapSettings: MapSettings,
	colors: Record<string, string>,
	countryColors: { primaryColor: string; secondaryColor: string },
	color: ColorConfig,
): string {
	let value = color.value;
	if (value === 'border') value = mapSettings.borderColor;
	if (value === 'primary') value = countryColors.primaryColor;
	if (value === 'secondary') value = countryColors.secondaryColor;
	value = colors[value] ?? colors['black'];

	// exit early if we can, to avoid potential infinite loop
	if (color.opacity == null && color.minimumContrast == null) return value;

	const backgroundColor = color.background
		? resolveColor(mapSettings, colors, countryColors, color.background)
		: resolveColor(mapSettings, colors, countryColors, { value: mapSettings.backgroundColor });

	if (color.opacity != null) {
		value = Color(value)
			.mix(Color(backgroundColor), 1 - color.opacity)
			.rgb()
			.toString();
	}

	if (color.minimumContrast != null) {
		if (getLuminanceContrast(value, backgroundColor) < color.minimumContrast) {
			return colors[getLuminance(backgroundColor) > 0.5 ? 'fallback_dark' : 'fallback_light'];
		} else {
			return value;
		}
	}

	return value;
}

function createHyperlanePaths(
	gameState: GameState,
	relayMegastructures: Set<number>,
	systemIdToUnionLeader: Record<number, number | undefined>,
	owner: null | number,
) {
	const hyperlanes = new Set<string>();
	const relayHyperlanes = new Set<string>();
	Object.entries(gameState.galactic_object)
		.map(parseNumberEntry)
		.forEach(([goId, go]) => {
			for (const hyperlane of getGameStateValueAsArray(go.hyperlane).filter((lane) => {
				if (owner != null) {
					return systemIdToUnionLeader[goId] === owner && systemIdToUnionLeader[lane.to] === owner;
				} else {
					return (
						systemIdToUnionLeader[goId] == null ||
						systemIdToUnionLeader[lane.to] == null ||
						systemIdToUnionLeader[goId] !== systemIdToUnionLeader[lane.to]
					);
				}
			})) {
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
	return { hyperlanesPath, relayHyperlanesPath };
}
