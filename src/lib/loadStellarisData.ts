import { invoke } from '@tauri-apps/api';
import { jsonify, tokenize } from './parseSave';
import { get, writable } from 'svelte/store';
import { localStorageStore } from '@skeletonlabs/skeleton';
import { rgb } from 'd3-color';
import { hsv } from 'd3-hsv';

const stellarisPathStore = localStorageStore('stellarisPath', '');
export const stellarisDataPromiseStore = writable(
	new Promise<Awaited<ReturnType<typeof loadStellarisData>>>(() => {
		// do nothing
	}),
);

export function loadStellarisData(installPath?: string) {
	const stellarisDataPromise = loadStellarisDataUnwrapped(installPath);
	stellarisDataPromiseStore.set(stellarisDataPromise);
	return stellarisDataPromise;
}

async function loadStellarisDataUnwrapped(installPath?: string) {
	const path =
		installPath ||
		get(stellarisPathStore) ||
		(await invoke<string>('get_stellaris_install_dir_cmd'));
	stellarisPathStore.set(path);
	const [colors, loc] = await Promise.all([loadColors(path), loadLoc(path)]);
	return { colors, loc };
}

export function loadEmblem(category: string, file: string) {
	const path = get(stellarisPathStore);
	return invoke<number[]>('get_emblem_cmd', { path, category, file }).then((numbers) =>
		Uint8Array.from(numbers),
	);
}

function loadLoc(path: string) {
	return invoke('get_stellaris_loc_cmd', { path }) as Promise<Record<string, string>>;
}

async function loadColors(path: string): Promise<Record<string, string>> {
	const rawContents = await invoke<string[]>('get_stellaris_colors_cmd', { path });
	const colors: Record<string, string> = {};
	for (const rawContent of rawContents) {
		const re = /(hsv|rgb)\s*(\{\s*\d+\.?\d*\s*\d+\.?\d*\s*\d+\.?\d*\s*\})/gi;
		const processedRawContent = rawContent.replace(re, (match) => {
			return `{ ${match.substring(0, 3)} = ${match.substring(3)} }`;
		});
		const parsed = jsonify(tokenize(processedRawContent)) as {
			colors: Record<
				string,
				{
					map: { hsv?: [number, number, number]; rgb?: [number, number, number] };
				}
			>;
		};
		Object.entries(parsed.colors).forEach(([key, val]) => {
			let vals: [number, number, number] = [0, 0, 0];
			if (val.map.rgb) {
				vals = val.map.rgb;
			} else if (val.map.hsv) {
				vals = val.map.hsv;
			}
			const color = val.map.rgb ? rgb(...vals) : hsv(vals[0] * 360, vals[1], vals[2]);
			colors[key] = color.formatRgb();
		});
	}
	colors.very_black = 'rgb(17, 17, 17)';
	colors.true_black = 'rgb(0, 0, 0)';
	return colors;
}
