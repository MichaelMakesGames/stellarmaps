import { get } from 'svelte/store';
import type { Country } from '../../GameState';
import { stellarisPathStore } from '../../loadStellarisData';
import stellarMapsApi from '../../stellarMapsApi';

const emblems: Record<string, Promise<string>> = {};
export async function processEmblems(countries: Country[]) {
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
					emblems[key] = stellarMapsApi.loadEmblem(
						get(stellarisPathStore),
						c.flag.icon.category,
						c.flag.icon.file,
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
			console.warn('failed to load emblem', keys[i], cur.reason);
		}
		return acc;
	}, {});
}
