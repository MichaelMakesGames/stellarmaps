import type { Planet } from '../../../GameState';
import type { MapSettings } from '../../../settings';

export function isAsteroid(planet: Planet) {
	return planet.planet_class.includes('asteroid');
}

export function isStar(planet: Planet) {
	return (
		isBlackHole(planet) ||
		planet.planet_class.includes('star') ||
		planet.planet_class === 'pc_pulsar' ||
		planet.planet_class === 'pc_collapsar' ||
		planet.planet_class === 'pc_nova_1' ||
		planet.planet_class === 'nova_2'
	);
}

export function isBlackHole(planet: Planet) {
	return planet.planet_class.includes('black_hole');
}

export function isColony(planet: Planet) {
	return planet.owner != null;
}

export function isMoon(planet: Planet) {
	return Boolean(planet.is_moon);
}

export function getPlanetRadius(planet: Planet, settings: MapSettings) {
	return Math.sqrt(
		planet.planet_size *
			(!isMoon(planet) && !isStar(planet) ? (settings.systemMapPlanetScale ?? 1) : 1) *
			(isStar(planet) ? (settings.systemMapStarScale ?? 1) : 1) *
			(isMoon(planet) ? (settings.systemMapMoonScale ?? 1) : 1),
	);
}

export function getPlanetStar(planet: Planet, planets: Planet[]) {
	return getPrimaryBodies(planet, planets).find(isStar);
}

export function isPlanetarySystemPrimaryBody(planet: Planet, planets: Planet[]) {
	if (isStar(planet)) return false;
	const primary = getPrimaryBodies(planet, planets)[0];
	if (primary && !isStar(primary)) return false;
	return true;
}

export function getPrimaryBodies(planet: Planet, planets: Planet[]) {
	const primaryBodies: Planet[] = [];
	let done = false;
	let planetToCheck: Planet = planet;
	while (!done) {
		let primaryBody = planets.find((p) => p.id === planetToCheck.moon_of);
		if (!primaryBody && !(planetToCheck.coordinate.x === 0 && planetToCheck.coordinate.y === 0)) {
			primaryBody = planets.find((p) => p.coordinate.x === 0 && p.coordinate.y === 0);
		}
		if (primaryBody) {
			primaryBodies.push(primaryBody);
			planetToCheck = primaryBody;
		} else {
			done = true;
		}
	}
	return primaryBodies;
}

export const PLANET_RING_PATTERN = (
	[
		[0.3, 0],
		[0.05, 0.05],
		[0.3, 0.15],
		[0.1, 0.5],
		[0.1, 1],
		[0.02, 0.5],
		[0.1, 1],
		[0.1, 0.5],
		[0.05, 0],
		[0.2, 0.3],
		[0.02, 0],
		[0.05, 0.5],
	] as [number, number][]
).map(([width, opacity], index, array) => {
	const radiusMultiplier =
		array.slice(0, index).reduce((total, [curWidth]) => total + curWidth, 0) + 1 + width / 2;
	return { width, opacity, radiusMultiplier };
});
