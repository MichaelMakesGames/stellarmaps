export default function convertBlobToDataUrl(blob: Blob) {
	const reader = new FileReader();
	const promise = new Promise<string>((resolve) => {
		reader.addEventListener('loadend', () => resolve(reader.result as string), true);
	});
	reader.readAsDataURL(blob);
	return promise;
}
