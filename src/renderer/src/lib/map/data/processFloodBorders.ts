import difference from '@turf/difference';
import * as helpers from '@turf/helpers';
import turfSimplify from '@turf/simplify';
import * as d3Contour from 'd3-contour';
import type { GameState } from '../../GameState';
import type { MapSettings } from '../../mapSettings';
import type processSystemOwnership from './processSystemOwnership';
import { smoothGeojson } from './smoothing';
import { getCountryColors, multiPolygonToPath, pointToGeoJSON } from './utils';

// Basic process
// create a grid
// stars claim their points for owner
// stars "bubble" out, claiming more points
// after a few iterations, add hyperlanes (owned on both ends and not intersecting any claimed "bubbles")
// keep iterating, bubbling the stars and hyperlanes
// smooth (cellular automata), vectorize, simplify, smooth
export default function processFloodBorders(
	gameState: GameState,
	settings: MapSettings,
	systemIdToUnionLeader: ReturnType<typeof processSystemOwnership>['systemIdToUnionLeader'],
	getSystemCoordinates: (id: number, options?: { invertX?: boolean }) => [number, number],
) {
	const SCALE = 4;
	const SCALED_SIZE = 1000 / SCALE;

	const countryValues: Record<number, number> = {};
	let nextValue = 1;
	function getCountryValue(country: number | null | undefined): number {
		if (country == null) return -1;
		if (countryValues[country] != null) {
			return countryValues[country] as number;
		} else {
			countryValues[country] = nextValue;
			nextValue++;
			return countryValues[country] as number;
		}
	}
	function getCountryFromValue(value: number): number | null {
		const idString = Object.entries(countryValues).find((entry) => entry[1] === value)?.[0];
		return idString == null ? null : parseInt(idString);
	}

	const pointSources: {
		type: 'point';
		x: number;
		y: number;
		country: number;
		expanding: boolean;
	}[] = [];
	for (const system of Object.values(gameState.galactic_object)) {
		const [x, y] = getSystemCoordinates(system.id, { invertX: true });
		const country = getCountryValue(systemIdToUnionLeader[system.id]);
		if (x > -500 && x < 500 && y > -500 && y < 500) {
			pointSources.push({
				type: 'point',
				x: Math.round((x + 500) / SCALE),
				y: Math.round((y + 500) / SCALE),
				country,
				expanding: true,
			});
		}
	}

	// TODO use uint8 array for better perf
	const points: number[][] = new Array(SCALED_SIZE);
	let numClaimedPoints = 0;
	for (let x = 0; x < SCALED_SIZE; x++) {
		points[x] = new Array(SCALED_SIZE);
	}

	const lineSources: {
		type: 'line';
		line: [number, number][];
		country: number;
		expanding: boolean;
	}[] = [];
	function addLineSources() {
		const resolvedConnections = new Set<string>();
		for (const fromSystem of Object.values(gameState.galactic_object)) {
			for (const hyperlane of fromSystem.hyperlane) {
				const key = [fromSystem.id, hyperlane.to].sort().toString();
				if (resolvedConnections.has(key)) continue;
				resolvedConnections.add(key);
				const toSystem = gameState.galactic_object[hyperlane.to];
				if (toSystem == null) continue;
				const hasSameOwner =
					systemIdToUnionLeader[fromSystem.id] === systemIdToUnionLeader[toSystem.id];
				if (!hasSameOwner) continue;
				const country = getCountryValue(systemIdToUnionLeader[fromSystem.id]);
				const from = getSystemCoordinates(fromSystem.id, { invertX: true });
				const to = getSystemCoordinates(toSystem.id, { invertX: true });
				const line = getLine(
					[Math.round((from[0] + 500) / SCALE), Math.round((from[1] + 500) / SCALE)],
					[Math.round((to[0] + 500) / SCALE), Math.round((to[1] + 500) / SCALE)],
				);
				if (line.every(([x, y]) => points[x]?.[y] == null || points[x]?.[y] === country)) {
					lineSources.push({
						type: 'line',
						line,
						country,
						expanding: true,
					});
				}
			}
		}
	}

	function checkPoints(
		source: (typeof pointSources)[number] | (typeof lineSources)[number],
		distance: number,
	) {
		source.expanding = false;
		const pointsToCheck =
			source.type === 'line'
				? getPointsAtDistanceFromLine(source.line, distance, SCALED_SIZE)
				: getPointsAtDistance(source.x, source.y, distance, SCALED_SIZE);
		for (const [x, y] of pointsToCheck) {
			// claim in unclaimed and one of the following:
			// - distance is zero (this is the first iteration)
			// - a neighbor cell is claimed by us
			// this logic prevents claiming a disconnected bubble or sliver
			if (
				points[x]?.[y] == null &&
				(distance === 0 ||
					getPointsAtDistance(x, y, 1, SCALED_SIZE).some(
						([neighborX, neighborY]) => points[neighborX]?.[neighborY] === source.country,
					))
			) {
				// @ts-expect-error points[x] is safe
				points[x][y] = source.country;
				numClaimedPoints++;
				source.expanding = true;
			}
		}
	}

	let claimDistance = 0;
	let hyperlaneClaimDistance = 0;
	const HYPERLANE_FIRST_ITERATION = 1;
	const MAX_HYPERLANE_CLAIM_DISTANCE = 3;
	const MAX_ITERATIONS = 6;
	while (numClaimedPoints < SCALED_SIZE ** 2 && claimDistance < MAX_ITERATIONS) {
		if (claimDistance === HYPERLANE_FIRST_ITERATION) {
			addLineSources();
		}

		if (lineSources.length > 0) {
			for (const source of lineSources) {
				if (!source.expanding) continue;
				checkPoints(source, hyperlaneClaimDistance);
			}
			if (hyperlaneClaimDistance < MAX_HYPERLANE_CLAIM_DISTANCE) {
				hyperlaneClaimDistance++;
			}
		}

		for (const source of pointSources) {
			if (!source.expanding) continue;
			checkPoints(source, claimDistance);
		}
		claimDistance++;
	}

	const SMOOTHING_ITERATIONS = 10;
	for (let i = 0; i < SMOOTHING_ITERATIONS; i++) {
		const updates: [[number, number], number][] = [];
		for (let x = 0; x < SCALED_SIZE; x++) {
			for (let y = 0; y < SCALED_SIZE; y++) {
				const currentVal = points[x]?.[y] ?? -1;
				const neighborCounts: Record<number, number> = {};
				const neighbors: [number, number][] = [
					[x - 1, y - 1],
					[x - 1, y],
					[x - 1, y + 1],
					[x, y - 1],
					[x, y + 1],
					[x + 1, y - 1],
					[x + 1, y],
					[x + 1, y + 1],
				];
				let largestNeighbor = -1;
				let largestNeighborCount = 0;
				for (const neighbor of neighbors) {
					const neighborVal = points[neighbor[0]]?.[neighbor[1]] ?? -1;
					neighborCounts[neighborVal] = (neighborCounts[neighborVal] ?? 0) + 1;
					const newCount = neighborCounts[neighborVal];
					if (
						newCount != null &&
						(newCount > largestNeighborCount ||
							(newCount === largestNeighborCount && neighborVal === currentVal))
					) {
						largestNeighborCount = newCount;
						largestNeighbor = neighborVal;
					}
				}
				if (largestNeighborCount >= 4) {
					updates.push([[x, y], largestNeighbor]);
				}
			}
		}
		for (const [[x, y], newVal] of updates) {
			// @ts-expect-error points[x][y] is safe
			points[x][y] = newVal;
		}
	}

	const isobandPoints: helpers.Feature<helpers.Point, { elevation: number }>[] = [];
	for (let x = 0; x < SCALED_SIZE; x++) {
		for (let y = 0; y < SCALED_SIZE; y++) {
			isobandPoints.push(
				helpers.point(pointToGeoJSON([-(x - 500), y - 500]), { elevation: points[x]?.[y] ?? -1 }),
			);
		}
	}

	const contours = d3Contour
		.contours()
		.smooth(false)
		.size([SCALED_SIZE, SCALED_SIZE])
		.thresholds(Object.values(countryValues))(isobandPoints.map((p) => p.properties.elevation));

	const multiPolygons: helpers.Feature<
		helpers.MultiPolygon | helpers.Polygon,
		{ value: number }
	>[] = contours.map((mp) =>
		helpers.feature(
			{
				...mp,
				coordinates: mp.coordinates.map((rings) =>
					rings.map((ring) =>
						ring.map(([x = 0, y = 0]) => pointToGeoJSON([-SCALE * y + 500, SCALE * x - 500])),
					),
				),
			} as unknown as helpers.MultiPolygon,
			{ value: mp.value },
		),
	);

	// TODO something isn't right with the diffing logic
	for (let i = 0; i < multiPolygons.length - 1; i++) {
		const current = multiPolygons[i];
		const next = multiPolygons[i + 1];
		if (current != null && next != null) {
			const diffed = difference(current, next);
			if (diffed != null) {
				multiPolygons[i] = helpers.feature(diffed.geometry, current.properties);
			} else {
				console.warn('diffed to oblivion!');
			}
		}
	}
	const paths = multiPolygons.map((mp) => {
		const country = getCountryFromValue(mp.properties.value);
		const colors = country == null ? null : getCountryColors(country, gameState, settings);
		const primaryColor = colors?.[0] ?? 'black';
		const secondaryColor = colors?.[1] ?? 'black';
		return {
			path: multiPolygonToPath(
				smoothGeojson(turfSimplify(mp, { highQuality: true, tolerance: 0.02, mutate: true }), 3),
				true,
			),
			country,
			primaryColor,
			secondaryColor,
		};
	});

	// the below code can create png of the pre-vectorized data
	// const rgbas: Record<number, [number, number, number, number]> = {};
	// function getRgba(country: number | null | undefined): [number, number, number, number] {
	// 	if (country == null || country === -1) return [0, 0, 0, 0];
	// 	if (rgbas[country] != null) {
	// 		return rgbas[country] as [number, number, number, number];
	// 	} else {
	// 		const rgba: [number, number, number, number] = [
	// 			Math.floor(Math.random() * 150) + 50,
	// 			Math.floor(Math.random() * 150) + 50,
	// 			Math.floor(Math.random() * 150) + 50,
	// 			255,
	// 		];
	// 		rgbas[country] = rgba;
	// 		return rgba;
	// 	}
	// }
	// const canvas = document.createElement('canvas');
	// canvas.width = SCALED_SIZE;
	// canvas.height = SCALED_SIZE;
	// const ctx = canvas.getContext('2d');
	// if (ctx) {
	// 	const imageData = ctx.createImageData(SCALED_SIZE, SCALED_SIZE);
	// 	for (let x = 0; x < SCALED_SIZE; x++) {
	// 		for (let y = 0; y < SCALED_SIZE; y++) {
	// 			const i = (y * SCALED_SIZE + x) * 4;
	// 			const [r, g, b, a] = getRgba(points[x]?.[y] as number);
	// 			imageData.data[i] = r;
	// 			imageData.data[i + 1] = g;
	// 			imageData.data[i + 2] = b;
	// 			imageData.data[i + 3] = a;
	// 		}
	// 	}
	// 	ctx.putImageData(imageData, 0, 0);
	// }
	// const png = canvas.toDataURL();
	// canvas.remove();
	return {
		paths,
	};
}

const offsetsMemo: Record<number, [number, number][]> = {};
function getPointOffsets(distance: number): [number, number][] {
	if (distance === 0) return [[0, 0]];
	if (offsetsMemo[distance] != null) return offsetsMemo[distance] as [number, number][];
	const points: [number, number][] = [];
	// manhattan distance
	// for (let i = 0; i < distance; i++) {
	// 	points.push([i, distance - i], [-i, -(distance - i)], [distance - i, -i], [-(distance - i), i]);
	// }
	// euclidean distance
	for (let dx = 0; dx <= distance; dx++) {
		for (let dy = 0; dy <= distance; dy++) {
			const manhattanDistance = dx + dy;
			const chebyshevDistance = Math.max(dx, dy);
			if (manhattanDistance < distance) continue;
			if (chebyshevDistance > distance) continue;
			const euclideanDistance = Math.ceil(Math.hypot(dx, dy));
			if (euclideanDistance === distance) {
				points.push([dx, dy], [-dx, dy], [dx, -dy], [-dx, -dy]);
			}
		}
	}
	offsetsMemo[distance] = points;
	return points;
}

function getPointsAtDistance(
	x: number,
	y: number,
	distance: number,
	size: number,
): [number, number][] {
	return getPointOffsets(distance)
		.map<[number, number]>(([dx, dy]) => [x + dx, y + dy])
		.filter(([x, y]) => x >= 0 && x < size && y >= 0 && y < size);
}

// adapted from https://www.redblobgames.com/grids/line-drawing/
function getLine(p0: [number, number], p1: [number, number]): [number, number][] {
	const points: [number, number][] = [];
	const dx = p1[0] - p0[0];
	const dy = p1[1] - p0[1];
	const N = Math.max(Math.abs(dx), Math.abs(dy));
	const divN = N === 0 ? 0.0 : 1.0 / N;
	const xstep = dx * divN;
	const ystep = dy * divN;
	let [x, y] = p0;
	for (let step = 0; step <= N; step++, x += xstep, y += ystep) {
		points.push([Math.round(x), Math.round(y)]);
	}
	return points;
}

function getPointsAtDistanceFromLine(
	line: [number, number][],
	distance: number,
	size: number,
): [number, number][] {
	// naive implementation; includes some points that are closer than `distance`
	return line.flatMap(([x, y]) => getPointsAtDistance(x, y, distance, size));
}
