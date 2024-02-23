import * as turf from '@turf/turf';
import polylabel from 'polylabel';
import type { GameState } from '../../GameState';
import type { MapSettings } from '../../mapSettings';
import type processBorders from './processBorders';
import type processNames from './processNames';
import type processSystemOwnership from './processSystemOwnership';
import type processTerraIncognita from './processTerraIncognita';
import { SCALE, getPolygons, inverseX, isUnionLeader, pointFromGeoJSON } from './utils';

export default function processLabels(
	gameState: GameState,
	settings: MapSettings,
	borders: ReturnType<typeof processBorders>,
	countryNames: Awaited<ReturnType<typeof processNames>>,
	knownCountries: ReturnType<typeof processTerraIncognita>['knownCountries'],
	ownedSystemPoints: ReturnType<typeof processSystemOwnership>['ownedSystemPoints'],
) {
	const labels = borders.map(({ countryId, geojson }) => {
		const name = countryNames[countryId] ?? '';
		const country = gameState.country[countryId];

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
			searchAspectRatio && geojson
				? getPolygons(geojson)
						.map((feature) => {
							const p = feature.geometry;
							if (settings.labelsAvoidHoles === 'all') return p;
							if (settings.labelsAvoidHoles === 'none')
								return turf.polygon([p.coordinates[0] ?? []]).geometry;
							// settings.labelsAvoidHoles === 'owned'
							return turf.polygon([
								p.coordinates[0] ?? [],
								...p.coordinates.slice(1).filter((hole) => {
									const holePolygon = turf.polygon([hole.slice().reverse()]);
									return ownedSystemPoints.some((ownedSystemPoint) =>
										turf.booleanPointInPolygon(ownedSystemPoint, holePolygon),
									);
								}),
							]).geometry;
						})
						.map<[turf.Polygon, turf.Position]>((polygon) => [
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
										xBuffer: settings.borderStroke.width / SCALE,
									})
								: null;
							if (
								textWidth != null &&
								settings.countryNamesMinSize != null &&
								textWidth * textAspectRatio * SCALE < settings.countryNamesMinSize
							) {
								textWidth = null;
							}
							if (
								textWidth != null &&
								settings.countryNamesMaxSize != null &&
								textWidth * textAspectRatio * SCALE > settings.countryNamesMaxSize
							) {
								textWidth = settings.countryNamesMaxSize / SCALE / textAspectRatio;
							}
							let emblemWidth = emblemAspectRatio
								? findLargestContainedRect({
										polygon,
										relativePoint: point,
										relativePointType: textWidth != null ? 'bottom' : 'middle',
										ratio: emblemAspectRatio,
										iterations: 8,
									})
								: null;
							if (
								emblemWidth != null &&
								settings.countryEmblemsMinSize != null &&
								emblemWidth * SCALE < settings.countryEmblemsMinSize
							) {
								emblemWidth = null;
							}
							if (
								emblemWidth != null &&
								settings.countryEmblemsMaxSize != null &&
								emblemWidth * SCALE > settings.countryEmblemsMaxSize
							) {
								emblemWidth = settings.countryEmblemsMaxSize / SCALE;
							}
							return {
								point: inverseX(pointFromGeoJSON(point)),
								emblemWidth: emblemWidth != null ? emblemWidth * SCALE : null,
								emblemHeight: emblemWidth != null ? emblemWidth * emblemAspectRatio * SCALE : null,
								textWidth: textWidth != null ? textWidth * SCALE : null,
								textHeight: textWidth != null ? textWidth * textAspectRatio * SCALE : null,
							};
						})
				: [];
		const emblemKey = country?.flag?.icon
			? `${country.flag.icon.category}/${country.flag.icon.file}`
			: null;
		return {
			labelPoints,
			name,
			emblemKey,
			isUnionLeader: isUnionLeader(countryId, gameState, settings),
			isKnown: knownCountries.has(countryId),
		};
	});
	return labels;
}

const measureTextContext = document
	.createElement('canvas')
	.getContext('2d') as CanvasRenderingContext2D;
function getTextAspectRatio(text: string, fontFamily: string) {
	measureTextContext.font = `10px '${fontFamily}'`;
	return 10 / measureTextContext.measureText(text).width;
}

function findLargestContainedRect({
	polygon,
	relativePoint,
	relativePointType,
	ratio,
	iterations,
	xBuffer = 0,
}: {
	polygon: turf.Polygon;
	relativePoint: turf.Position;
	relativePointType: 'top' | 'bottom' | 'middle';
	ratio: number;
	iterations: number;
	xBuffer?: number;
}) {
	let bestWidth: null | number = null;
	let failedWidth: null | number = null;
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
			if (failedWidth == null) {
				testWidth *= 2;
			} else {
				testWidth = (testWidth + failedWidth) / 2;
			}
		} else {
			failedWidth = testWidth;
			if (bestWidth == null) {
				testWidth /= 2;
			} else {
				testWidth = (testWidth + bestWidth) / 2;
			}
		}
	}
	return bestWidth;
}

function makeRect(
	relativePoint: turf.Position,
	relativePointType: 'top' | 'bottom' | 'middle',
	width: number,
	height: number,
): turf.Polygon {
	const dx = width / 2;
	const dy = height / 2;
	const center: turf.Position = [relativePoint[0], relativePoint[1]];
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
	return turf.polygon([points]).geometry;
}

function aspectRatioSensitivePolylabel(
	polygon: turf.Position[][],
	precision: number,
	aspectRatio: number,
) {
	const scaledPolygon = polygon.map((ring) =>
		ring.map((point) => [point[0] * aspectRatio, point[1]]),
	);
	const scaledPoint = polylabel(scaledPolygon, precision) as unknown as turf.Position;
	const point: turf.Position = [scaledPoint[0] / aspectRatio, scaledPoint[1]];
	return point;
}

// The booleanContains function from turf doesn't seem to work with concave polygons
// This is stricter and simplified a bit since we know the inner shape is a rectangle
function contains(polygon: turf.Polygon, rect: turf.Polygon) {
	const [r1, r2, r3, r4] = rect.coordinates[0] ?? [];
	if (r1 == null || r2 == null || r3 == null || r4 == null) {
		throw new Error('rect has too few points!');
	}
	if (
		!turf.booleanPointInPolygon(turf.point(r1), polygon) ||
		!turf.booleanPointInPolygon(turf.point(r2), polygon) ||
		!turf.booleanPointInPolygon(turf.point(r3), polygon) ||
		!turf.booleanPointInPolygon(turf.point(r4), polygon)
	)
		return false;
	const xs = [r1[0], r2[0], r3[0], r4[0]];
	const ys = [r1[1], r2[1], r3[1], r4[1]];
	const minX = Math.min(...xs);
	const maxX = Math.max(...xs);
	const minY = Math.min(...ys);
	const maxY = Math.max(...ys);
	return !polygon.coordinates.flat().some(([x, y]) => {
		return x > minX && x < maxX && y > minY && y < maxY;
	});
}
