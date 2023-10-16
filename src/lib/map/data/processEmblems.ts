import type { Country } from '$lib/GameState';
import { loadEmblem } from '$lib/loadStellarisData';

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
					emblems[key] = loadEmblem(c.flag.icon.category, c.flag.icon.file).then((content) =>
						convertDds(key.replace('/', '__'), content),
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
			console.warn('failed to load emblem', keys[i]);
		}
		return acc;
	}, {});
}

const magickImport = '/magickApi.js';
async function convertDds(key: string, content: Uint8Array) {
	const result = await (
		await import(magickImport /* @vite-ignore */)
	).execute({
		inputFiles: [{ name: 'test.dds', content: content }],
		commands: [`convert test.dds test.png`],
	});
	if (result.exitCode === 0) {
		const reader = new FileReader();
		const promise = new Promise<string>((resolve) => {
			reader.addEventListener('loadend', () => resolve(reader.result as string), true);
		});
		reader.readAsDataURL(new Blob([result.outputFiles[0].buffer]));
		return promise;
	} else {
		return Promise.reject('magick returned non-zero exit code');
	}
}
