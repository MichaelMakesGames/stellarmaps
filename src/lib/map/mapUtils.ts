import { hsl, lab } from 'd3-color';
import { interpolateRgb } from 'd3-interpolate';
import type { SVGAttributes } from 'svelte/elements';

import { ADDITIONAL_COLORS } from '../colors';
import type { ColorSetting, ColorSettingAdjustment, MapSettings, StrokeSetting } from '../settings';

interface CountryColors {
	primaryColor: string;
	secondaryColor: string;
}

export function resolveColor({
	mapSettings,
	colors,
	countryColors: countryColorsOption,
	planetColor,
	colorStack,
	resolveToOpaqueColor,
}: {
	mapSettings: MapSettings;
	colors: Record<string, string>;
	countryColors?: null | CountryColors | (CountryColors | null | undefined)[];
	planetColor?: string;
	colorStack: ColorSetting[];
	resolveToOpaqueColor?: boolean;
}): string {
	if (colorStack[0] == null) {
		console.error(`resolveColor called with empty colorSettingStack; falling back to black`);
		return colors['black'] ?? 'rgb(0, 0, 0)';
	}
	let colorString = colorStack[0].color;
	const backgroundSettingStack =
		colorStack.length > 1 ? colorStack.slice(1) : [mapSettings.backgroundColor];
	const isBackgroundColor = colorStack[0] === mapSettings.backgroundColor;

	let countryColors: CountryColors = { primaryColor: 'black', secondaryColor: 'black' };
	if (Array.isArray(countryColorsOption) && countryColorsOption[0]) {
		countryColors = countryColorsOption[0];
	} else if (countryColorsOption && !Array.isArray(countryColorsOption)) {
		countryColors = countryColorsOption;
	}

	if (colorString === 'border') {
		colorString = resolveColor({
			mapSettings,
			colors,
			countryColors: Array.isArray(countryColorsOption)
				? [countryColorsOption[0], ...countryColorsOption]
				: countryColorsOption,
			colorStack: [mapSettings.borderColor, ...backgroundSettingStack],
			resolveToOpaqueColor,
		});
	} else if (colorString === 'planet') {
		colorString = planetColor ?? 'rgb(0, 0, 0)';
	} else if (colorString === 'planet_complement') {
		colorString = planetColor ?? 'rgb(0, 0, 0)';
		const color = hsl(colorString);
		color.h = color.h > 180 ? color.h - 180 : color.h + 180;
		colorString = color.formatRgb();
	} else {
		if (colorString === 'primary') colorString = countryColors.primaryColor;
		if (colorString === 'secondary') colorString = countryColors.secondaryColor;
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
					countryColors: Array.isArray(countryColorsOption)
						? countryColorsOption.slice(1)
						: countryColorsOption,
					colorStack: backgroundSettingStack,
					resolveToOpaqueColor: true,
				}),
			);
			if (Math.abs(color.l - bgColor.l) < adjustment.value * 100) {
				const lightenedL = bgColor.l + adjustment.value * 100;
				const lightenSuccess = lightenedL <= 100;

				const darkenedL = bgColor.l - adjustment.value * 100;
				const darkenSuccess = darkenedL >= 0;

				const lightenedIsCloserToOriginal =
					Math.abs(lightenedL - color.l) < Math.abs(darkenedL - color.l);
				const darkenedIsCloserToOriginal =
					Math.abs(lightenedL - color.l) < Math.abs(darkenedL - color.l);

				if (lightenSuccess && darkenSuccess) {
					if (lightenedIsCloserToOriginal) {
						color.l = lightenedL;
					} else if (darkenedIsCloserToOriginal) {
						color.l = darkenedL;
					} else if (color.l < bgColor.l) {
						color.l = darkenedL;
					} else if (color.l > bgColor.l) {
						color.l = lightenedL;
					} else {
						color.l = bgColor.l >= 50 ? darkenedL : lightenedL;
					}
				} else if (lightenSuccess) {
					color.l = lightenedL;
				} else if (darkenSuccess) {
					color.l = darkenedL;
				} else {
					color.l = bgColor.l >= 50 ? 0 : 100;
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
						countryColors: Array.isArray(countryColorsOption)
							? countryColorsOption.slice(1)
							: countryColorsOption,
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

export function getBackgroundColor(
	colors: Record<string, string> | null | undefined,
	mapSettings: MapSettings | null | undefined,
) {
	if (!colors || !mapSettings) return ADDITIONAL_COLORS.very_black;
	return resolveColor({
		mapSettings: mapSettings,
		colors: colors,
		colorStack: [mapSettings.backgroundColor],
	});
}

export function multiplyOpacity(colorSetting: ColorSetting, value: number): ColorSetting {
	const opacityAdjustment = colorSetting.colorAdjustments.find(
		(adjustment) => adjustment.type === 'OPACITY',
	);
	if (opacityAdjustment) {
		return {
			...colorSetting,
			colorAdjustments: colorSetting.colorAdjustments.map((adjustment) =>
				adjustment === opacityAdjustment
					? { type: 'OPACITY', value: opacityAdjustment.value * value }
					: adjustment,
			),
		};
	} else {
		return {
			...colorSetting,
			colorAdjustments: [...colorSetting.colorAdjustments, { type: 'OPACITY', value }],
		};
	}
}
