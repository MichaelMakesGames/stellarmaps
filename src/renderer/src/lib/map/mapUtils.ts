import { lab } from 'd3-color';
import { interpolateRgb } from 'd3-interpolate';
import type { SVGAttributes } from 'svelte/elements';
import type {
	ColorSetting,
	ColorSettingAdjustment,
	MapSettings,
	StrokeSetting,
} from '../mapSettings';
import type { MapData } from './data/processMapData';

export function getDisplayedBorders(data: MapData, settings: MapSettings) {
	return data.borders.filter((border) => border.isKnown || !settings.terraIncognita);
}
export interface ColorConfig {
	value: ColorSetting;
	background?: ColorConfig;
}

export function resolveColor({
	mapSettings,
	colors,
	countryColors,
	colorStack,
	resolveToOpaqueColor,
}: {
	mapSettings: MapSettings;
	colors: Record<string, string | undefined>;
	countryColors?: null | { primaryColor: string; secondaryColor: string };
	colorStack: ColorSetting[];
	resolveToOpaqueColor?: boolean;
}): string {
	if (colorStack.length === 0) {
		console.error(`resolveColor called with empty colorSettingStack; falling back to black`);
		return colors['black'] ?? 'rgb(0, 0, 0)';
	}
	let colorString = colorStack[0].color;
	const backgroundSettingStack =
		colorStack.length > 1 ? colorStack.slice(1) : [mapSettings.backgroundColor];
	const isBackgroundColor = colorStack[0] === mapSettings.backgroundColor;

	if (colorString === 'border') {
		colorString = resolveColor({
			mapSettings,
			colors,
			countryColors,
			colorStack: [mapSettings.borderColor, ...backgroundSettingStack],
			resolveToOpaqueColor,
		});
	} else {
		if (colorString === 'primary') colorString = countryColors?.primaryColor ?? 'black';
		if (colorString === 'secondary') colorString = countryColors?.secondaryColor ?? 'black';
		colorString = colors[colorString] ?? colors['black'] ?? 'rgb(0, 0, 0)';
	}

	for (const adjustment of sortColorAdjustments(colorStack[0].colorAdjustments)) {
		const color = lab(colorString);
		if (adjustment.type === 'DARKEN') {
			color.l = Math.max(0, color.l - adjustment.value * 100);
			colorString = color.formatRgb();
		}
		if (adjustment.type === 'LIGHTEN') {
			color.l = Math.min(100, color.l + adjustment.value * 100);
			colorString = color.formatRgb();
		}
		if (adjustment.type === 'MAX_LIGHTNESS') {
			color.l = Math.min(color.l, adjustment.value * 100);
			colorString = color.formatRgb();
		}
		if (adjustment.type === 'MIN_LIGHTNESS') {
			color.l = Math.max(color.l, adjustment.value * 100);
			colorString = color.formatRgb();
		}
		if (adjustment.type === 'MIN_CONTRAST' && !isBackgroundColor) {
			const bgColor = lab(
				resolveColor({
					mapSettings,
					colors,
					countryColors,
					colorStack: backgroundSettingStack,
					resolveToOpaqueColor: true,
				}),
			);
			if (Math.abs(color.l - bgColor.l) < adjustment.value * 100) {
				if (bgColor.l < 50) {
					color.l = Math.min(100, bgColor.l + adjustment.value * 100);
				} else {
					color.l = Math.max(0, bgColor.l - adjustment.value * 100);
				}
			}
			colorString = color.formatRgb();
		}
		if (adjustment.type === 'OPACITY' && !isBackgroundColor) {
			if (resolveToOpaqueColor) {
				const bgColor = lab(
					resolveColor({
						mapSettings,
						colors,
						countryColors,
						colorStack: backgroundSettingStack,
						resolveToOpaqueColor: true,
					}),
				);
				colorString = interpolateRgb.gamma(2.2)(bgColor, colorString)(adjustment.value);
			} else {
				color.opacity = adjustment.value;
				colorString = color.formatRgb();
			}
		}
	}

	return colorString;
}

function sortColorAdjustments(adjustments: ColorSettingAdjustment[]) {
	const order: ColorSettingAdjustment['type'][] = [
		'DARKEN',
		'LIGHTEN',
		'MAX_LIGHTNESS',
		'MIN_LIGHTNESS',
		'OPACITY',
		'MIN_CONTRAST',
	];
	return adjustments.slice().sort((a, b) => {
		return order.indexOf(a.type) - order.indexOf(b.type);
	});
}

export function getStrokeAttributes(strokeSetting: StrokeSetting): SVGAttributes<SVGPathElement> {
	return {
		'stroke-dasharray': strokeSetting.dashed ? strokeSetting.dashArray : null,
		'stroke-width': strokeSetting.width.toString(),
		'stroke-linecap': strokeSetting.dashed ? null : 'round',
		'stroke-linejoin': strokeSetting.dashed ? null : 'round',
	};
}

export function getStrokeColorAttributes(resolveColorOptions: Parameters<typeof resolveColor>[0]) {
	const color = lab(resolveColor(resolveColorOptions));
	const opacity = color.opacity;
	if (opacity !== 1) {
		color.opacity = 1;
	}
	return {
		stroke: color.formatRgb(),
		'stroke-opacity': opacity,
	};
}

export function getFillColorAttributes(resolveColorOptions: Parameters<typeof resolveColor>[0]) {
	const color = lab(resolveColor(resolveColorOptions));
	const opacity = color.opacity;
	if (opacity !== 1) {
		color.opacity = 1;
	}
	return {
		fill: color.formatRgb(),
		'fill-opacity': opacity,
	};
}
