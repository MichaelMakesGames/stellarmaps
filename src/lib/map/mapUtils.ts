import Color from 'color';
import type { MapSettings } from '../mapSettings';
import { getLuminance, getLuminanceContrast } from '../utils';
import type { MapData } from './data/processMapData';

export function getDisplayedBorders(data: MapData, settings: MapSettings) {
	return data.borders.filter((border) => border.isKnown || !settings.terraIncognita);
}
export interface ColorConfig {
	value: string;
	opacity?: number;
	minimumContrast?: number;
	background?: ColorConfig;
}

export function resolveColor(
	mapSettings: MapSettings,
	colors: Record<string, string>,
	countryColors: { primaryColor: string; secondaryColor: string },
	color: ColorConfig,
): string {
	let value = color.value;
	if (value === 'border') value = mapSettings.borderColor;
	if (value === 'primary') value = countryColors.primaryColor;
	if (value === 'secondary') value = countryColors.secondaryColor;
	value = colors[value] ?? colors['black'];

	// exit early if we can, to avoid potential infinite loop
	if (color.opacity == null && color.minimumContrast == null) return value;

	const backgroundColor = color.background
		? resolveColor(mapSettings, colors, countryColors, color.background)
		: resolveColor(mapSettings, colors, countryColors, { value: mapSettings.backgroundColor });

	if (color.opacity != null) {
		value = Color(value)
			.mix(Color(backgroundColor), 1 - color.opacity)
			.rgb()
			.toString();
	}

	if (color.minimumContrast != null) {
		if (getLuminanceContrast(value, backgroundColor) < color.minimumContrast) {
			return colors[getLuminance(backgroundColor) > 0.5 ? 'fallback_dark' : 'fallback_light'];
		} else {
			return value;
		}
	}

	return value;
}
