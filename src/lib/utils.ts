import type { getToastStore } from '@skeletonlabs/skeleton';

export function toastError<T>(options: {
	title: string;
	defaultValue: T;
	toastStore: ReturnType<typeof getToastStore>;
}): (reason: unknown) => T {
	return (reason: unknown) => {
		options.toastStore.trigger({
			message: `
        <h4 class="h4">${options.title}</h4>
        <pre class="bg-error-700 p-2 my-2 rounded">${reason}</pre>
        <p>At this time, StellarMaps only supports the Steam version of Stellaris. If you are using the Steam version, please file a bug report.</p>
      `,
			autohide: false,
		});
		return options.defaultValue;
	};
}

export function wait(ms: number): Promise<never> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getLuminance(color: string): number {
	const re = /rgba?\(\s*(?<r>\d+)\s*,\s*(?<g>\d+)\s*,\s*(?<b>\d+)\s*,\s*(?<a>\d+\.?\d*)\s*\)/;
	const match = color.match(re);
	if (match) {
		return (
			(0.2126 * parseInt(match.groups?.r ?? '0')) / 255 +
			(0.7152 * parseInt(match.groups?.g ?? '0')) / 255 +
			(0.0722 * parseInt(match.groups?.b ?? '0')) / 255
		);
	} else {
		console.warn('Failed to parse color', color);
		return 0.5;
	}
}

export function getLuminanceContrast(color1: string, color2: string): number {
	const color1Luminance = getLuminance(color1);
	const color2Luminance = getLuminance(color2);
	const ratio =
		color1Luminance > color2Luminance
			? (color2Luminance + 0.05) / (color1Luminance + 0.05)
			: (color1Luminance + 0.05) / (color2Luminance + 0.05);
	return 1 - ratio;
}
