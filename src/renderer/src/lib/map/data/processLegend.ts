import { get } from 'svelte/store';

import { t } from '../../../intl';
import type { GameState } from '../../GameState';
import type { ColorSetting, MapSettings } from '../../settings';
import { localizeText } from './locUtils';
import { mapModes, type MapModeSystemValue } from './mapModes';
import type processBorders from './processBorders';
import type processSystems from './processSystems';
import { getTextAspectRatio } from './utils';

interface LegendItem {
	symbol:
		| {
				type: 'icon';
				icon: string;
				color: ColorSetting;
		  }
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

export default async function processLegend(
	gameState: GameState,
	settings: Pick<MapSettings, (typeof processLegendDeps)[number]>,
	borders: ReturnType<typeof processBorders>,
	systems: ReturnType<typeof processSystems>,
): Promise<LegendData> {
	const mapMode = mapModes[settings.mapMode];
	const countryMapModeLegendItems: LegendItem[] =
		mapMode?.country == null
			? []
			: mapMode.country
					.filter((mapModeCountry) => mapModeCountry.showInLegend === 'always')
					.map((mapModeCountry) => ({
						label: mapModeCountry.label ? get(t)(mapModeCountry.label) : '',
						symbol: {
							type: 'border',
							primaryColor: mapModeCountry.primaryColor,
							secondaryColor: mapModeCountry.secondaryColor ?? mapModeCountry.primaryColor,
						},
					}));

	const systemMapModeLegendItems: LegendItem[] = await Promise.all(
		Object.values(
			systems.reduce<Record<string, MapModeSystemValue>>((acc, cur) => {
				for (const value of cur.mapModeValues ?? []) {
					acc[value.legendIndex] = value;
				}
				return acc;
			}, {}),
		)
			.sort((a, b) => a.legendIndex - b.legendIndex)
			.map<Promise<LegendItem>>(async (value) => {
				const values: Record<string, string> = {};
				for (const [k, v] of Object.entries(value.legendLabelData ?? {})) {
					values[k] = await localizeText(v);
				}
				return {
					label:
						typeof value.legendLabel === 'string'
							? get(t)(value.legendLabel, values)
							: await localizeText(value.legendLabel),
					symbol: {
						type: 'icon',
						icon: 'icon-circle',
						color: value.legendColor ?? value.color,
					},
				};
			}),
	);

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

	const items = insertHrBetweenGroups([
		countryMapModeLegendItems,
		systemMapModeLegendItems,
		occupationLegendItems,
	]);
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
