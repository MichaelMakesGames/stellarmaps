/* eslint-disable @typescript-eslint/no-unnecessary-condition */
// TODO re-enable the above, after making safer
import type { GameState } from '../../GameState';
import type { MapSettings } from '../../mapSettings';
import { interpolateBasis } from 'd3-interpolate';
import { SCALE, getGameStateValueAsArray, pointFromGeoJSON, pointToGeoJSON } from './utils';
import * as helpers from '@turf/helpers';
import difference from '@turf/difference';
import turfCircle from '@turf/circle';
import union from '@turf/union';
import convex from '@turf/convex';
import centerOfMass from '@turf/center-of-mass';

const CIRCLE_OUTER_PADDING = 20;
const CIRCLE_INNER_PADDING = 10;
const OUTLIER_DISTANCE = 30;
const OUTLIER_RADIUS = 15;
const STARBURST_NUM_SLICES = 12;
const STARBURST_LINES_PER_SLICE = 50;
const STARBURST_SLICE_ANGLE = (Math.PI * 2) / STARBURST_NUM_SLICES;
const ONE_DEGREE = Math.PI / 180;

export default function processCircularGalaxyBorders(
	gameState: GameState,
	settings: MapSettings,
	systemIdToCoordinates: Record<number, [number, number]>,
) {
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
		points: helpers.FeatureCollection<helpers.Point>;
	}[] = [];

	for (const go of Object.values(gameState.galactic_object)) {
		if (clusters.some((cluster) => cluster.systems.has(go.id))) continue;
		const cluster: (typeof clusters)[0] = {
			systems: new Set<number>([go.id]),
			outliers: new Set<number>(),
			bBox: {
				xMin: systemIdToCoordinates[go.id][0],
				xMax: systemIdToCoordinates[go.id][0],
				yMin: systemIdToCoordinates[go.id][1],
				yMax: systemIdToCoordinates[go.id][1],
			},
			points: helpers.featureCollection([
				helpers.point(pointToGeoJSON(systemIdToCoordinates[go.id])),
			]),
		};
		const edge = go.hyperlane?.map((hyperlane) => hyperlane.to) ?? [];
		const edgeSet = new Set(edge);
		while (edge.length > 0) {
			const nextId = edge.pop();
			if (nextId == null) break; // this shouldn't be possible, here for type inference
			edgeSet.delete(nextId);
			const next = gameState.galactic_object[nextId];
			if (next != null && !cluster.systems.has(nextId)) {
				cluster.systems.add(nextId);
				cluster.points.features.push(helpers.point(pointToGeoJSON(systemIdToCoordinates[nextId])));
				const nextHyperlanes = getGameStateValueAsArray(next.hyperlane);
				const isOutlier =
					nextHyperlanes.length === 1 && nextHyperlanes[0].length > OUTLIER_DISTANCE;
				if (isOutlier) {
					cluster.outliers.add(nextId);
				} else {
					if (systemIdToCoordinates[nextId][0] < cluster.bBox.xMin)
						cluster.bBox.xMin = systemIdToCoordinates[nextId][0];
					if (systemIdToCoordinates[nextId][0] > cluster.bBox.xMax)
						cluster.bBox.xMax = systemIdToCoordinates[nextId][0];
					if (systemIdToCoordinates[nextId][1] < cluster.bBox.yMin)
						cluster.bBox.yMin = systemIdToCoordinates[nextId][1];
					if (systemIdToCoordinates[nextId][1] > cluster.bBox.yMax)
						cluster.bBox.yMax = systemIdToCoordinates[nextId][1];
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
					let systemAngle = Math.atan2(systemIdToCoordinates[id][1], systemIdToCoordinates[id][0]);
					if (systemAngle < 0) systemAngle = Math.PI * 2 + systemAngle;
					return (
						!mainCluster.outliers.has(id) && systemAngle >= minAngle && systemAngle <= maxAngle
					);
				}),
				0,
				0,
				gameState,
				systemIdToCoordinates,
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

	const galaxyBorderCircles = clusters
		.map((cluster) => {
			const isStarburstCluster = cluster === mainCluster && gameState.galaxy.shape === 'starburst';
			let cx = (cluster.bBox.xMin + cluster.bBox.xMax) / 2;
			let cy = (cluster.bBox.yMin + cluster.bBox.yMax) / 2;
			if (cluster === mainCluster) {
				cx = 0;
				cy = 0;
			} else {
				const hull = convex(cluster.points);
				if (hull) {
					const hullCenter = centerOfMass(hull);
					const point = pointFromGeoJSON(hullCenter.geometry.coordinates);
					cx = point[0];
					cy = point[1];
				}
			}
			const [minR, maxR] = getMinMaxSystemRadii(
				Array.from(cluster.systems).filter((id) => !cluster.outliers.has(id)),
				cx,
				cy,
				gameState,
				systemIdToCoordinates,
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
					cx: systemIdToCoordinates[outlierId][0],
					cy: systemIdToCoordinates[outlierId][1],
					r: OUTLIER_RADIUS,
					type: 'outlier',
				})),
			);
			return clusterCircles;
		})
		// sort biggest to smallest, so if an inner circle contains a smaller cluster, the smaller one isn't erased
		.sort((a, b) => b[0].r - a[0].r)
		.flat();
	let galaxyBorderCirclesGeoJSON: null | helpers.Feature<helpers.Polygon | helpers.MultiPolygon> =
		starburstGeoJSON;
	for (const circle of galaxyBorderCircles) {
		const polygon = turfCircle(pointToGeoJSON([circle.cx, circle.cy]), circle.r / SCALE, {
			units: 'degrees',
			steps: Math.ceil(circle.r),
		});
		if (circle.type === 'outer-padded' || circle.type === 'outlier') {
			if (galaxyBorderCirclesGeoJSON == null) {
				galaxyBorderCirclesGeoJSON = polygon;
			} else {
				galaxyBorderCirclesGeoJSON = union(galaxyBorderCirclesGeoJSON, polygon);
			}
		} else if (circle.type === 'inner-padded') {
			if (galaxyBorderCirclesGeoJSON != null) {
				galaxyBorderCirclesGeoJSON = difference(galaxyBorderCirclesGeoJSON, polygon);
			}
		}
	}
	return { galaxyBorderCircles, galaxyBorderCirclesGeoJSON };
}

function getMinMaxSystemRadii(
	systemIds: number[],
	cx: number,
	cy: number,
	gameState: GameState,
	systemIdToCoordinates: Record<number, [number, number]>,
): [number, number] {
	const sortedRadiusesSquared = systemIds
		.map((id) => {
			return (cx - systemIdToCoordinates[id][0]) ** 2 + (cy - systemIdToCoordinates[id][1]) ** 2;
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
