import { get, writable } from 'svelte/store';

export type NumberMapSettings =
	| 'borderWidth'
	| 'hyperlaneWidth'
	| 'hyperlaneOpacity'
	| 'hyperRelayWidth'
	| 'hyperRelayOpacity';

export type NumberOptionalMapSettings =
	| 'countryEmblemsMaxSize'
	| 'countryEmblemsMinSize'
	| 'countryNamesMaxSize'
	| 'countryNamesMinSize';

export type StringMapSettings = 'borderFillColor' | 'borderColor';

export type BooleanMapSettings = 'borderSmoothing' | 'countryEmblems' | 'countryNames';
export type MapSettings = Record<NumberMapSettings, number> &
	Record<NumberOptionalMapSettings, number | null> &
	Record<StringMapSettings, string> &
	Record<BooleanMapSettings, boolean>;

export interface IdAndName {
	id: string;
	name: string;
}

interface MapSettingConfigBase extends IdAndName {
	requiresReprocessing?: boolean;
	hideIf?: (settings: MapSettings) => boolean;
}

export interface MapSettingConfigToggle extends MapSettingConfigBase {
	id: BooleanMapSettings;
	type: 'toggle';
}

export interface MapSettingConfigNumber extends MapSettingConfigBase {
	id: NumberMapSettings | NumberOptionalMapSettings;
	type: 'number';
	min?: number;
	max?: number;
	step: number;
	optional?: boolean;
}

export interface MapSettingConfigRange extends MapSettingConfigBase {
	id: NumberMapSettings | NumberOptionalMapSettings;
	type: 'range';
	min: number;
	max: number;
	step: number;
}

export interface MapSettingConfigSelect extends MapSettingConfigBase {
	id: StringMapSettings;
	type: 'select';
	options: IdAndName[];
}

export type MapSettingConfig =
	| MapSettingConfigToggle
	| MapSettingConfigNumber
	| MapSettingConfigRange
	| MapSettingConfigSelect;

export interface MapSettingGroup extends IdAndName {
	settings: MapSettingConfig[];
}

export const mapSettingConfig: MapSettingGroup[] = [
	{
		id: 'borders',
		name: 'Country Borders',
		settings: [
			{
				id: 'borderFillColor',
				name: 'Fill Color',
				type: 'select',
				options: [
					{ id: 'primary', name: 'Primary' },
					{ id: 'secondary', name: 'Secondary' },
				],
			},
			{
				id: 'borderColor',
				name: 'Border Color',
				type: 'select',
				options: [
					{ id: 'primary', name: 'Primary' },
					{ id: 'secondary', name: 'Secondary' },
					{ id: 'white', name: 'White' },
				],
			},
			{
				id: 'borderWidth',
				name: 'Border Width',
				requiresReprocessing: true,
				type: 'number',
				min: 0,
				step: 0.5,
			},
			{
				id: 'borderSmoothing',
				name: 'Border Smoothing',
				requiresReprocessing: true,
				type: 'toggle',
			},
		],
	},
	{
		id: 'countryLabels',
		name: 'Country Labels',
		settings: [
			{
				id: 'countryNames',
				name: 'Names',
				requiresReprocessing: true,
				type: 'toggle',
			},
			{
				id: 'countryNamesMinSize',
				name: 'Name Min Size',
				requiresReprocessing: true,
				type: 'number',
				min: 0,
				step: 1,
				optional: true,
				hideIf: (settings) => !settings.countryNames,
			},
			{
				id: 'countryNamesMaxSize',
				name: 'Name Max Size',
				requiresReprocessing: true,
				type: 'number',
				min: 0,
				step: 1,
				optional: true,
				hideIf: (settings) => !settings.countryNames,
			},
			{
				id: 'countryEmblems',
				name: 'Emblems',
				requiresReprocessing: true,
				type: 'toggle',
			},
			{
				id: 'countryEmblemsMinSize',
				name: 'Emblem Min Size',
				requiresReprocessing: true,
				type: 'number',
				min: 0,
				step: 1,
				optional: true,
				hideIf: (settings) => !settings.countryEmblems,
			},
			{
				id: 'countryEmblemsMaxSize',
				name: 'Emblem Max Size',
				requiresReprocessing: true,
				type: 'number',
				min: 0,
				step: 1,
				optional: true,
				hideIf: (settings) => !settings.countryEmblems,
			},
		],
	},
	{
		id: 'hyperlanes',
		name: 'Hyperlanes',
		settings: [
			{
				id: 'hyperlaneWidth',
				name: 'Hyperlane Width',
				type: 'number',
				min: 0,
				step: 0.5,
			},
			{
				id: 'hyperlaneOpacity',
				name: 'Hyperlane Opacity',
				type: 'range',
				min: 0,
				max: 1,
				step: 0.05,
			},
			{
				id: 'hyperRelayWidth',
				name: 'Hyper Relay Width',
				type: 'number',
				min: 0,
				step: 0.5,
			},
			{
				id: 'hyperRelayOpacity',
				name: 'Hyper Relay Opacity',
				type: 'range',
				min: 0,
				max: 1,
				step: 0.05,
			},
		],
	},
];

export const defaultMapSettings: MapSettings = {
	borderFillColor: 'primary',
	borderColor: 'secondary',
	borderWidth: 2,
	borderSmoothing: true,
	hyperlaneWidth: 1,
	hyperlaneOpacity: 0.2,
	hyperRelayWidth: 3,
	hyperRelayOpacity: 0.2,
	countryNames: true,
	countryNamesMinSize: 10,
	countryNamesMaxSize: null,
	countryEmblems: true,
	countryEmblemsMinSize: null,
	countryEmblemsMaxSize: null,
};

export const mapSettings = writable(defaultMapSettings);
export const lastProcessedMapSettings = writable(defaultMapSettings);
export const reprocessMap = () => lastProcessedMapSettings.set(get(mapSettings));
