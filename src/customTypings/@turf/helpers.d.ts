import '@turf/helpers';

declare module '@turf/helpers' {
	interface Position extends Array<number> {
		0: number;
		1: number;
	}
}
