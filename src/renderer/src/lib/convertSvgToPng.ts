import { wait } from './utils';

interface ConvertSvgToPngOptions {
	left: number;
	top: number;
	width: number;
	height: number;
	outputWidth: number;
	outputHeight: number;
	backgroundImageUrl?: string;
	backgroundColor?: string;
}
export default async function convertSvgToPng(
	svg: SVGElement,
	{
		left,
		top,
		width,
		height,
		outputWidth,
		outputHeight,
		backgroundImageUrl,
		backgroundColor,
	}: ConvertSvgToPngOptions,
) {
	const canvas = document.createElement('canvas');
	canvas.width = outputWidth;
	canvas.height = outputHeight;
	const ctx = canvas.getContext('2d');
	if (ctx == null) {
		throw new Error('no canvas ctx');
	}

	const bgImg = document.createElement('img');
	bgImg.width = outputWidth;
	bgImg.height = outputHeight;
	bgImg.style.display = 'none';
	document.body.append(bgImg);
	const bgImgReady =
		backgroundImageUrl == null
			? Promise.resolve()
			: new Promise<void>((resolve) => {
					bgImg.addEventListener('load', () => resolve(), { once: true });
				});
	bgImg.src = backgroundImageUrl ?? '';

	const img = document.createElement('img');
	img.width = outputWidth;
	img.height = outputHeight;
	img.style.display = 'none';
	document.body.appendChild(img);
	const promise = new Promise<Blob>((resolve, reject) => {
		img.addEventListener(
			'load',
			async function () {
				// the data url images within the SVG haven't necessarily loaded at this point
				// wait a bit to give them time to render
				await wait(100);
				if (backgroundColor != null) {
					ctx.fillStyle = backgroundColor;
					ctx.fillRect(0, 0, outputWidth, outputHeight);
				}
				if (backgroundImageUrl != null) {
					await bgImgReady;
					ctx.drawImage(bgImg, 0, 0);
				}
				ctx.drawImage(img, 0, 0);
				canvas.toBlob(
					async (b) => {
						if (b == null) {
							reject('canvas.toBlob failed');
						} else {
							resolve(b);
						}
					},
					'image/png',
					0.95,
				);
				document.body.removeChild(img);
				document.body.removeChild(bgImg);
				canvas.remove();
			},
			{ once: true },
		);
	});

	const bgRect = svg.firstChild as SVGRectElement;
	svg.setAttribute('width', outputWidth.toString());
	svg.setAttribute('height', outputHeight.toString());
	svg.setAttribute('viewBox', `${left} ${top} ${width} ${height}`);
	bgRect.setAttribute('x', left.toString());
	bgRect.setAttribute('y', top.toString());
	bgRect.setAttribute('width', width.toString());
	bgRect.setAttribute('height', height.toString());
	const svgUrl = URL.createObjectURL(new Blob([svg.outerHTML], { type: 'image/svg+xml' }));

	img.src = svgUrl;
	return promise;
}
