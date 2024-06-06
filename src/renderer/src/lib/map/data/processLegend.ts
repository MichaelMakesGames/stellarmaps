import { get } from 'svelte/store';
import { t } from '../../../intl';
import type { GameState } from '../../GameState';
import type { MapSettings } from '../../settings';
import { mapModes } from './mapModes';
import type processBorders from './processBorders';
import { getTextAspectRatio } from './utils';

interface LegendItem {
	symbol: {
		type: 'border';
		primaryColor: string;
		secondaryColor: string;
	};
	label: string;
}

interface LegendData {
	items: LegendItem[];
	maxLabelWidth: number;
}

export const processLegendDeps = [
	'mapMode',
	'mapModePointOfView',
	'legendFontSize',
] satisfies (keyof MapSettings)[];

export default function processLegend(
	gameState: GameState,
	settings: Pick<MapSettings, (typeof processLegendDeps)[number]>,
	borders: ReturnType<typeof processBorders>,
): LegendData {
	const mapMode = mapModes[settings.mapMode];
	const mapModeLegendItems: LegendItem[] =
		mapMode == null
			? []
			: mapMode.country
					.filter(
						(mapModeCountry, index) =>
							mapModeCountry.showInLegend === 'always' ||
							(mapModeCountry.showInLegend === 'exists' &&
								borders.some((b) => b.mapModeIndex === index)),
					)
					.map((mapModeCountry) => ({
						label: get(t)(mapModeCountry.label),
						symbol: {
							type: 'border',
							primaryColor: mapModeCountry.primaryColor,
							secondaryColor: mapModeCountry.secondaryColor ?? mapModeCountry.primaryColor,
						},
					}));
	const items = [...mapModeLegendItems];
	return {
		items,
		maxLabelWidth: Math.max(
			...items.map((item) => settings.legendFontSize / getTextAspectRatio(item.label, 'system-ui')),
		),
	};
}
