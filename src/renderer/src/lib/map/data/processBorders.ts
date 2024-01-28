import type { GameState, Sector } from '../../GameState';
import type { MapSettings } from '../../mapSettings';
import { parseNumberEntry } from '../../utils';
import explode from '@turf/explode';
import type processCircularGalaxyBorders from './processCircularGalaxyBorder';
import type processSystemOwnership from './processSystemOwnership';
import {
	SCALE,
	createHyperlanePaths,
	getAllPositionArrays,
	getCountryColors,
	getUnionLeaderId,
	joinSystemPolygons,
	multiPolygonToPath,
	positionToString,
	segmentToPath,
} from './utils';
import * as helpers from '@turf/helpers';
import { getSmoothedPosition, smoothGeojson } from './smoothing';
import buffer from '@turf/buffer';
import type processHyperRelays from './processHyperRelays';
import type processTerraIncognita from './processTerraIncognita';
import difference from '@turf/difference';

export default function processBorders(
	gameState: GameState,
	settings: MapSettings,
	unionLeaderToSystemPolygons: ReturnType<
		typeof processSystemOwnership
	>['unionLeaderToSystemPolygons'],
	unionLeaderToUnionMembers: ReturnType<typeof processSystemOwnership>['unionLeaderToUnionMembers'],
	countryToOwnedSystemIds: ReturnType<typeof processSystemOwnership>['countryToOwnedSystemIds'],
	systemIdToPolygon: ReturnType<typeof processSystemOwnership>['systemIdToPolygon'],
	systemIdToUnionLeader: ReturnType<typeof processSystemOwnership>['systemIdToUnionLeader'],
	relayMegastructures: ReturnType<typeof processHyperRelays>,
	knownCountries: ReturnType<typeof processTerraIncognita>['knownCountries'],
	galaxyBorderCirclesGeoJSON: ReturnType<
		typeof processCircularGalaxyBorders
	>['galaxyBorderCirclesGeoJSON'],
	systemIdToCoordinates: Record<number, [number, number]>,
) {
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
							const isLastPos = i === positionArray.length - 1;
							const nextPosition = positionArray[(i + (isLastPos ? 2 : 1)) % positionArray.length];
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
					const posIsLast = posIndex === posArray.length - 1;
					const posSharedSectors = sectorOuterPolygons
						.map((s, i) => i)
						.filter(
							(otherSectorIndex) =>
								otherSectorIndex !== sectorIndex &&
								sectorOuterPoints[otherSectorIndex].has(posString),
						);

					const nextPosIndex = (posIndex + (posIsLast ? 2 : 1)) % posArray.length;
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
						firstSegment.length &&
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
			sectorSegments = sectorSegments.filter((segment) => segment.length > 1);
			// check for union border segments
			const unionBorderSegments = sectorSegments.filter((segment) => {
				const firstLineString = [positionToString(segment[0]), positionToString(segment[1])]
					.sort()
					.join(',');
				return unionMemberBorderLines.has(firstLineString);
			});
			// extend segments at border, so they reach the border (border can shift from smoothing in next step)
			if (settings.borderStroke.smoothing) {
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
			if (settings.borderStroke.smoothing) {
				smoothedOuterBorderGeoJSON = smoothGeojson(outerBorderGeoJSON, 2);
			}
			const smoothedInnerBorderGeoJSON = buffer(
				smoothedOuterBorderGeoJSON,
				-settings.borderStroke.width / SCALE,
				{ units: 'degrees' },
			);
			const outerPath = multiPolygonToPath(
				smoothedOuterBorderGeoJSON,
				settings.borderStroke.smoothing,
			);
			const innerPath = multiPolygonToPath(
				smoothedInnerBorderGeoJSON,
				settings.borderStroke.smoothing,
			);
			const borderOnlyGeoJSON = difference(smoothedOuterBorderGeoJSON, smoothedInnerBorderGeoJSON);
			const borderPath = borderOnlyGeoJSON
				? multiPolygonToPath(borderOnlyGeoJSON, settings.borderStroke.smoothing)
				: '';
			const { hyperlanesPath, relayHyperlanesPath } = createHyperlanePaths(
				gameState,
				settings,
				relayMegastructures,
				systemIdToUnionLeader,
				countryId,
				systemIdToCoordinates,
			);
			return {
				countryId,
				primaryColor,
				secondaryColor,
				outerPath,
				innerPath,
				borderPath,
				hyperlanesPath,
				relayHyperlanesPath,
				sectorBorders: sectorSegments.map((segment) => ({
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
		});
	return borders;
}
