import { get } from 'svelte/store';
import { t } from '../../../intl';
import type { GameState } from '../../GameState';
import type { MapSettings } from '../../settings';
import { mapModes } from './mapModes';
import type processBorders from './processBorders';
import { getTextAspectRatio } from './utils';

interface LegendItem {
	symbol:
		| {
				type: 'border';
				primaryColor: string;
				secondaryColor: string;
		  }
		| {
				type: 'pattern';
				pattern: string;
		  }
		| {
				type: 'hr';
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
	'occupation',
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
	const occupationLegendItems: LegendItem[] = settings.occupation
		? [
				{
					label: get(t)('legend.fully_occupied'),
					symbol: {
						type: 'pattern',
						pattern: 'pattern-full-occupier',
					},
				},
				{
					label: get(t)('legend.partially_occupied'),
					symbol: {
						type: 'pattern',
						pattern: 'pattern-partial-occupier',
					},
				},
			]
		: [];
	const items = insertHrBetweenGroups([mapModeLegendItems, occupationLegendItems]);
	return {
		items,
		maxLabelWidth: Math.max(
			...items.map((item) => settings.legendFontSize / getTextAspectRatio(item.label, 'system-ui')),
		),
	};
}

function insertHrBetweenGroups(groups: LegendItem[][]): LegendItem[] {
	return groups
		.filter((group) => group.length)
		.map<LegendItem[]>((group, i) =>
			i === 0 ? group : [{ label: '', symbol: { type: 'hr' } }, ...group],
		)
		.flat();
}
