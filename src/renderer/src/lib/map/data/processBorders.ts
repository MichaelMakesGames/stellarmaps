import * as turf from '@turf/turf';
import type { GameState, Sector } from '../../GameState';
import type { MapSettings } from '../../settings';
import { getOrDefault, isDefined, parseNumberEntry } from '../../utils';
import { getCountryMapModeInfo } from './mapModes';
import type processCircularGalaxyBorders from './processCircularGalaxyBorder';
import type { BorderCircle } from './processCircularGalaxyBorder';
import type processHyperRelays from './processHyperRelays';
import type processSystemOwnership from './processSystemOwnership';
import type processTerraIncognita from './processTerraIncognita';
import { getSmoothedPosition, smoothGeojson } from './smoothing';
import {
	SCALE,
	applyGalaxyBoundary,
	createHyperlanePaths,
	getAllPositionArrays,
	getFrontierSectorPseudoId,
	getPolygons,
	getSharedDistancePercent,
	getUnionLeaderId,
	makeBorderCircleGeojson,
	multiPolygonToPath,
	pointToGeoJSON,
	positionToString,
	segmentToPath,
	type PolygonalFeature,
} from './utils';

export const processBordersDeps = [
	'unionMode',
	'unionFederations',
	'unionHegemonies',
	'unionSubjects',
	'unionFederationsColor',
	'hyperlaneMetroStyle',
	'borderStroke',
	'unionBorderStroke',
	'sectorBorderStroke',
	'mapMode',
	'mapModePointOfView',
	'borderGap',
] satisfies (keyof MapSettings)[];

export default function processBorders(
	gameState: GameState,
	settings: Pick<MapSettings, (typeof processBordersDeps)[number]>,
	unionLeaderToGeojson: Record<number, PolygonalFeature>,
	countryToGeojson: Record<number, PolygonalFeature>,
	sectorToGeojson: Record<number, PolygonalFeature>,
	unionLeaderToUnionMembers: ReturnType<typeof processSystemOwnership>['unionLeaderToUnionMembers'],
	unionLeaderToSystemIds: Record<number, Set<number>>,
	countryToOwnedSystemIds: Record<number, Set<number>>,
	systemIdToUnionLeader: ReturnType<typeof processSystemOwnership>['systemIdToUnionLeader'],
	relayMegastructures: ReturnType<typeof processHyperRelays>,
	knownCountries: ReturnType<typeof processTerraIncognita>['knownCountries'],
	galaxyBorderCircles: BorderCircle[],
	galaxyBorderCirclesGeoJSON: ReturnType<
		typeof processCircularGalaxyBorders
	>['galaxyBorderCirclesGeoJSON'],
	getSystemCoordinates: (id: number, options?: { invertX?: boolean }) => [number, number],
) {
	const unassignedFragments: [number, turf.Feature<turf.Polygon>][] = [];
	const borders = Object.entries(unionLeaderToGeojson)
		.map(parseNumberEntry)
		.map(([countryId, outerBorderGeoJSON]) => {
			const mapModeInfo = getCountryMapModeInfo(countryId, gameState, settings);

			const countrySectors = Object.values(gameState.sectors).filter(
				(sector) =>
					sector.owner != null &&
					getUnionLeaderId(sector.owner, gameState, settings, ['joinedBorders']) === countryId,
			);
			for (const unionMemberId of unionLeaderToUnionMembers[countryId]?.values() ?? []) {
				const frontierSector: Sector = {
					id: getFrontierSectorPseudoId(unionMemberId),
					systems: Array.from(
						getOrDefault(countryToOwnedSystemIds, unionMemberId, new Set()).values(),
					).filter((systemId) => countrySectors.every((s) => !s.systems.includes(systemId))),
					owner: unionMemberId,
				};
				if (frontierSector.systems.length) {
					countrySectors.push(frontierSector);
				}
			}
			const sectorOuterPolygons = countrySectors
				.map((sector) => sectorToGeojson[sector.id])
				.filter(isDefined);

			const unionMemberOuterPolygons = Array.from(
				unionLeaderToUnionMembers[countryId]?.values() ?? [],
			)
				.map((unionMemberId) => countryToGeojson[unionMemberId])
				.filter(isDefined);

			const unionMemberBorderLines: Set<string> = new Set();
			getAllPositionArrays(turf.featureCollection(unionMemberOuterPolygons)).forEach(
				(positionArray) =>
					positionArray.forEach((p, i) => {
						const nextPosition = positionArray[(i + 1) % positionArray.length] as turf.Position;
						unionMemberBorderLines.add(
							[positionToString(p), positionToString(nextPosition)].sort().join(','),
						);
					}),
			);

			const allBorderPoints: Set<string> = new Set(
				turf.coordAll(outerBorderGeoJSON).map((coord) => positionToString(coord)),
			);
			const sectorOuterPoints: Set<string>[] = sectorOuterPolygons.map(
				(p) => new Set(turf.coordAll(p).map((coord) => positionToString(coord))),
			);
			// include all border lines in this, so we don't draw sectors border where there is already an external border
			const addedSectorLines: Set<string> = new Set(
				getAllPositionArrays(outerBorderGeoJSON)
					.map((positionArray) =>
						positionArray.map((p, i) => {
							const isLastPos = i === positionArray.length - 1;
							const nextPosition = positionArray[
								(i + (isLastPos ? 2 : 1)) % positionArray.length
							] as turf.Position;
							return [positionToString(p), positionToString(nextPosition)].sort().join(',');
						}),
					)
					.flat(),
			);
			const sectorSegments: turf.Position[][] = [];
			sectorOuterPolygons.flatMap(getAllPositionArrays).forEach((sectorRing, sectorIndex) => {
				let currentSegment: turf.Position[] = [];
				const firstSegment = currentSegment;
				sectorRing.forEach((pos, posIndex, posArray) => {
					const posString = positionToString(pos);
					const posIsLast = posIndex === posArray.length - 1;
					const posSharedSectors = sectorOuterPolygons
						.map((s, i) => i)
						.filter(
							(otherSectorIndex) =>
								otherSectorIndex !== sectorIndex &&
								sectorOuterPoints[otherSectorIndex]?.has(posString),
						);

					const nextPosIndex = (posIndex + (posIsLast ? 2 : 1)) % posArray.length;
					const nextPos = posArray[nextPosIndex] as turf.Position;
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
						// shared by 2+ other sectors
						// or next line already added by other segment (or external border)
						if (
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
						firstSegment[0] != null &&
						positionToString(firstSegment[0]) === posString &&
						firstSegment !== currentSegment
					) {
						// last segment joins up with first segment
						currentSegment.pop(); // drop the duplicate point
						firstSegment.unshift(...currentSegment); // insert into start of firstSegment
						currentSegment = []; // clear currentSegment
					}
				});
				// push last segment
				if (currentSegment.length) {
					sectorSegments.push(currentSegment);
				}
			});
			// make sure there are no 0 or 1 length segments
			const nonEmptySectorSegments = sectorSegments.filter(
				(segment): segment is [turf.Position, turf.Position, ...turf.Position[]] =>
					segment.length > 1,
			);
			// check for union border segments
			const unionBorderSegments = nonEmptySectorSegments.filter((segment) => {
				const firstLineString = [positionToString(segment[0]), positionToString(segment[1])]
					.sort()
					.join(',');
				return unionMemberBorderLines.has(firstLineString);
			});
			// extend segments at border, so they reach the border (border can shift from smoothing in next step)
			if (settings.borderStroke.smoothing) {
				nonEmptySectorSegments.forEach((segment) => {
					if (allBorderPoints.has(positionToString(segment[0]))) {
						segment[0] = getSmoothedPosition(segment[0], outerBorderGeoJSON);
					}
					if (allBorderPoints.has(positionToString(segment[segment.length - 1] as turf.Position))) {
						segment[segment.length - 1] = getSmoothedPosition(
							segment[segment.length - 1] as turf.Position,
							outerBorderGeoJSON,
						);
					}
				});
			}

			let boundedOuterBorderGeoJSON = applyGalaxyBoundary(
				outerBorderGeoJSON,
				galaxyBorderCirclesGeoJSON,
			);

			if (galaxyBorderCirclesGeoJSON) {
				const fragments: turf.Feature<turf.Polygon>[] = [];
				for (const polygon of getPolygons(boundedOuterBorderGeoJSON)) {
					const systems = new Set(
						Array.from(unionLeaderToSystemIds[countryId] ?? []).filter((systemId) => {
							const coordinate = getSystemCoordinates(systemId);
							const point = turf.point(pointToGeoJSON(coordinate));
							return turf.booleanPointInPolygon(point, polygon);
						}),
					);
					if (systems.size === 0) {
						fragments.push(polygon);
						unassignedFragments.push([countryId, polygon]);
					} else {
						const circles = galaxyBorderCircles.filter((c) => {
							if (c.type !== 'outer-padded' && c.type !== 'outlier') return false;
							if (systems.size < c.systems.size) {
								return Array.from(systems).some((id) => c.systems.has(id));
							} else {
								return Array.from(c.systems).some((id) => systems.has(id));
							}
						});
						const outerCircles = circles.filter((c) => c.type === 'outer-padded');
						if (outerCircles.length === 1 && !outerCircles[0]?.isMainCluster) {
							// all stars in this polygon belong to a non-main cluster
							// try to find fragments outside of it's cluster's bounds
							const bounds = circles.reduce<PolygonalFeature | null>((acc, cur) => {
								const geojson = makeBorderCircleGeojson(gameState, getSystemCoordinates, cur);
								if (acc == null) return geojson;
								if (geojson == null) return acc;
								return turf.union(acc, geojson);
							}, null);
							const outOfBounds = bounds == null ? null : turf.difference(polygon, bounds);
							fragments.push(...getPolygons(outOfBounds));
							unassignedFragments.push(
								...getPolygons(outOfBounds).map<(typeof unassignedFragments)[number]>((geojson) => [
									countryId,
									geojson,
								]),
							);
						}
					}
				}
				for (const fragment of fragments) {
					boundedOuterBorderGeoJSON =
						boundedOuterBorderGeoJSON == null
							? null
							: turf.difference(boundedOuterBorderGeoJSON, fragment);
				}
			}

			const { hyperlanesPath, relayHyperlanesPath } = createHyperlanePaths(
				gameState,
				settings,
				relayMegastructures,
				systemIdToUnionLeader,
				countryId,
				getSystemCoordinates,
			);

			return {
				countryId,
				...mapModeInfo,
				outerPath: '', // we need to wait for these, because fragments might need to be assigned
				innerPath: '', // we need to wait for these, because fragments might need to be assigned
				borderPath: '', // we need to wait for these, because fragments might need to be assigned
				geojson: boundedOuterBorderGeoJSON,
				hyperlanesPath,
				relayHyperlanesPath,
				sectorBorders: nonEmptySectorSegments.map((segment) => ({
					path: segmentToPath(
						segment,
						unionBorderSegments.includes(segment)
							? settings.unionBorderStroke.smoothing
							: settings.sectorBorderStroke.smoothing,
					),
					isUnionBorder: unionBorderSegments.includes(segment),
				})),
				isKnown: knownCountries.has(countryId),
			};
		})
		.filter(isDefined);

	const unionLeaderToPositionStrings: Record<number, Set<string>> = Object.fromEntries(
		borders.map((border) => [
			border.countryId,
			new Set(border.geojson == null ? [] : turf.coordAll(border.geojson).map(positionToString)),
		]),
	);

	for (const [originalCountryId, fragment] of unassignedFragments) {
		let unionLeaderId: number | undefined;
		let unionLeaderSharedDistancePercent = Number.EPSILON;
		Object.entries(unionLeaderToGeojson)
			.map(parseNumberEntry)
			.filter(([id]) => id !== originalCountryId)
			.forEach(([id]) => {
				const sharedDistancePercent = getSharedDistancePercent(
					fragment,
					getOrDefault(unionLeaderToPositionStrings, id, new Set()),
				);
				if (sharedDistancePercent >= unionLeaderSharedDistancePercent) {
					unionLeaderId = id;
					unionLeaderSharedDistancePercent = sharedDistancePercent;
				}
			});
		const border =
			unionLeaderId == null ? null : borders.find((b) => b.countryId === unionLeaderId);
		const geojson = border == null ? null : border.geojson;
		if (border && geojson) {
			border.geojson = turf.union(geojson, fragment);
		}
	}

	for (const border of borders) {
		const boundedOuterBorderGeoJSON = border.geojson;
		let smoothedOuterBorderGeoJSON = boundedOuterBorderGeoJSON;
		if (settings.borderStroke.smoothing && boundedOuterBorderGeoJSON != null) {
			smoothedOuterBorderGeoJSON = smoothGeojson(boundedOuterBorderGeoJSON, 2);
		}
		smoothedOuterBorderGeoJSON =
			smoothedOuterBorderGeoJSON == null
				? null
				: (turf.buffer(smoothedOuterBorderGeoJSON, -(settings.borderGap ?? 0) / 2 / SCALE, {
						units: 'degrees',
						steps: settings.borderStroke.smoothing ? 8 : 1,
					}) as ReturnType<typeof turf.buffer> | null);
		const smoothedInnerBorderGeoJSON =
			smoothedOuterBorderGeoJSON == null
				? null
				: (turf.buffer(smoothedOuterBorderGeoJSON, -settings.borderStroke.width / SCALE, {
						units: 'degrees',
						steps: settings.borderStroke.smoothing ? 8 : 1,
					}) as ReturnType<typeof turf.buffer> | null);
		border.outerPath =
			smoothedOuterBorderGeoJSON == null
				? ''
				: multiPolygonToPath(smoothedOuterBorderGeoJSON, settings.borderStroke.smoothing);
		border.innerPath =
			smoothedInnerBorderGeoJSON == null
				? ''
				: multiPolygonToPath(smoothedInnerBorderGeoJSON, settings.borderStroke.smoothing);
		const borderOnlyGeoJSON =
			settings.borderStroke.width === 0
				? null
				: smoothedInnerBorderGeoJSON == null || smoothedOuterBorderGeoJSON == null
					? smoothedOuterBorderGeoJSON
					: turf.difference(smoothedOuterBorderGeoJSON, smoothedInnerBorderGeoJSON);
		border.borderPath = borderOnlyGeoJSON
			? multiPolygonToPath(borderOnlyGeoJSON, settings.borderStroke.smoothing)
			: '';
	}
	return borders;
}
