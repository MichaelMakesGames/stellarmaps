import { invoke } from '@tauri-apps/api';
import { jsonify, tokenize } from './parseSave';
import { get, writable } from 'svelte/store';
import { localStorageStore } from '@skeletonlabs/skeleton';

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
	const rawContent = await invoke<string>('get_stellaris_colors_cmd', { path });
	const parsed = jsonify(tokenize(rawContent as string)) as Record<
		string,
		{ color: [number, number, number, number] }
	>;
	return Object.fromEntries(
		Object.entries(parsed)
			.map<[string, string]>(([key, value]) => [
				key,
				`rgba(${value.color[0]}, ${value.color[1]}, ${value.color[2]}, ${value.color[3] / 255})`,
			])
			.concat([
				['fallback_dark', 'rgba(0, 0, 0, 0.75)'],
				['fallback_light', 'rgba(255, 255, 255, 0.75)'],
			]),
	);
}
