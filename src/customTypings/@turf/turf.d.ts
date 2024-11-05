import type { AllGeoJSON } from '@turf/turf';

declare module '@turf/turf' {
	// turf types the return value as number[][] not GeoJSON.Position[]
	// so it doesn't pick up that we change the Position from number[] to [number, number]
	export function coordAll(geojson: AllGeoJSON): GeoJSON.Position[];
}
