import '@turf/turf';

declare module '@turf/turf' {
	export interface Position extends Array<number> {
		0: number;
		1: number;
	}

	export function coordAll(geojson: AllGeoJSON): Position[];
}
