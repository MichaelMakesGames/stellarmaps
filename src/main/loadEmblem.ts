// import { Magick } from 'magickwand.js';

export default async function loadEmblem(
	_installPath: string,
	_category: string,
	_file: string,
): Promise<string> {
	// const paths = await getStellarisDataPaths(installPath, `flags/${category}/map/${file}`);
	return '';
	// return convertDds(paths[0]);
}

// async function convertDds(p: string) {
// 	const magickImage = new Magick.Image();
// 	await magickImage.readAsync(p);
// 	await magickImage.magickAsync('PNG');
// 	const magickBlob = new Magick.Blob();
// 	await magickImage.writeAsync(magickBlob);
// 	const base64 = await magickBlob.base64Async();
// 	return `data:image/png;base64,${base64}`;
// }
