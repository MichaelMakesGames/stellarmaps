import Color from 'color';
import type {
	ColorSetting,
	ColorSettingAdjustment,
	MapSettings,
	StrokeSetting,
} from '../mapSettings';
import { getLuminance, getLuminanceContrast } from '../utils';
import type { MapData } from './data/processMapData';
import type { SVGAttributes } from 'svelte/elements';

export function getDisplayedBorders(data: MapData, settings: MapSettings) {
	return data.borders.filter((border) => border.isKnown || !settings.terraIncognita);
}
export interface ColorConfig {
	value: ColorSetting;
	background?: ColorConfig;
}

export function resolveColor(
	mapSettings: MapSettings,
	colors: Record<string, string>,
	countryColors: undefined | null | { primaryColor: string; secondaryColor: string },
	color: ColorConfig,
): string {
	let value = color.value.color;

	if (value === 'border') {
		value = resolveColor(mapSettings, colors, countryColors, { value: mapSettings.borderColor });
	} else {
		if (value === 'primary') value = countryColors?.primaryColor ?? 'black';
		if (value === 'secondary') value = countryColors?.secondaryColor ?? 'black';
		value = colors[value] ?? colors['black'];
	}

	// exit early if we can, to avoid potential infinite loop
	if (color.value.colorAdjustments.length === 0) return value;

	for (const adjustment of sortColorAdjustments(color.value.colorAdjustments)) {
		if (adjustment.type === 'Darken') {
			let lab = Color(value).lab();
			lab = lab.l(Math.max(0, lab.l() - adjustment.value * 100));
			value = lab.rgb().toString();
		}
		if (adjustment.type === 'Lighten') {
			let lab = Color(value).lab();
			lab = lab.l(Math.min(100, lab.l() + adjustment.value * 100));
			value = lab.rgb().toString();
		}
		if (adjustment.type === 'Max Lightness') {
			let lab = Color(value).lab();
			lab = lab.l(Math.min(lab.l(), adjustment.value * 100));
			value = lab.rgb().toString();
		}
		if (adjustment.type === 'Min Lightness') {
			let lab = Color(value).lab();
			lab = lab.l(Math.max(lab.l(), adjustment.value * 100));
			value = lab.rgb().toString();
		}
		if (adjustment.type === 'Min Contrast') {
			const backgroundColor = color.background
				? resolveColor(mapSettings, colors, countryColors, color.background)
				: resolveColor(mapSettings, colors, countryColors, { value: mapSettings.backgroundColor });
			if (getLuminanceContrast(value, backgroundColor) < adjustment.value) {
				value = colors[getLuminance(backgroundColor) > 0.5 ? 'fallback_dark' : 'fallback_light'];
			}
		}
		if (adjustment.type === 'Opacity') {
			const backgroundColor = color.background
				? resolveColor(mapSettings, colors, countryColors, color.background)
				: resolveColor(mapSettings, colors, countryColors, { value: mapSettings.backgroundColor });
			value = Color(value)
				.mix(Color(backgroundColor), 1 - adjustment.value)
				.rgb()
				.toString();
		}
	}

	return value;
}

function sortColorAdjustments(adjustments: ColorSettingAdjustment[]) {
	const order: ColorSettingAdjustment['type'][] = [
		'Darken',
		'Lighten',
		'Max Lightness',
		'Min Lightness',
		'Opacity',
		'Min Contrast',
	];
	return adjustments.slice().sort((a, b) => {
		return order.indexOf(a.type) - order.indexOf(b.type);
	});
}

export function getStrokeAttributes(
	strokeSetting: StrokeSetting,
	glow: boolean,
): SVGAttributes<SVGPathElement> {
	return {
		'stroke-dasharray': strokeSetting.dashed ? strokeSetting.dashArray : null,
		filter: glow && strokeSetting.glow ? 'url(#glow)' : null,
		'stroke-width': strokeSetting.width.toString(),
		'stroke-linecap': strokeSetting.dashed ? null : 'round',
		'stroke-linejoin': strokeSetting.dashed ? null : 'round',
	};
}
