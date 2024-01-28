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

// async function convertDds(key: string, content: Uint8Array) {
// 	console.log('begin', key);
// 	const { Magick } = await IM;
// 	const magickImage = new Magick.Image;
// 	console.log('reading dds');
// 	await magickImage.readAsync(new Magick.Blob(content));
// 	console.log('converting dds to png');
// 	await magickImage.magickAsync('PNG');
// 	const magickBlob = new Magick.Blob;
// 	console.log('writing blob');
// 	magickImage.writeAsync(magickBlob);
// 	console.log('converting blob to base64');
// 	const base64 = await magickBlob.base64Async();
// 	console.log('done', key);
// 	return base64;
// 	// const magickApi: any = await import('../../magickApi');
// 	// const result = await magickApi.execute({
// 	// 	inputFiles: [{ name: 'test.dds', content: content }],
// 	// 	commands: [`convert test.dds test.png`],
// 	// });
// 	// if (result.exitCode === 0) {
// 	// 	const reader = new FileReader();
// 	// 	const promise = new Promise<string>((resolve) => {
// 	// 		reader.addEventListener('loadend', () => resolve(reader.result as string), true);
// 	// 	});
// 	// 	const blob = new Blob([result.outputFiles[0].buffer], { type: 'image/png' });
// 	// 	reader.readAsDataURL(blob);
// 	// 	return promise;
// 	// } else {
// 	// 	return Promise.reject('magick returned non-zero exit code');
// 	// }
// }
