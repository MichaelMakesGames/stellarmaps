import { get, writable, type Readable, readable } from 'svelte/store';
import { loadFonts } from './tauriCommands';

export type NumberMapSettings =
	| 'borderWidth'
	| 'sectorBorderWidth'
	| 'hyperlaneWidth'
	| 'hyperlaneOpacity'
	| 'hyperRelayWidth'
	| 'hyperRelayOpacity'
	| 'sectorBorderMinContrast'
	| 'countryCapitalIconSize'
	| 'sectorCapitalIconSize'
	| 'populatedSystemIconSize'
	| 'populatedSystemIconMinContrast'
	| 'unpopulatedSystemIconSize';

export type NumberOptionalMapSettings =
	| 'countryEmblemsMaxSize'
	| 'countryEmblemsMinSize'
	| 'countryNamesMaxSize'
	| 'countryNamesMinSize';

export type StringMapSettings =
	| 'borderFillColor'
	| 'borderColor'
	| 'sectorBorderColor'
	| 'sectorBorderDashArray'
	| 'labelsAvoidHoles'
	| 'countryNamesFont'
	| 'countryCapitalIcon'
	| 'sectorCapitalIcon'
	| 'populatedSystemIcon'
	| 'populatedSystemIconColor'
	| 'unpopulatedSystemIcon';

export type BooleanMapSettings =
	| 'borderSmoothing'
	| 'countryEmblems'
	| 'countryNames'
	| 'sectorBorders'
	| 'sectorBorderSmoothing';

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
	dynamicOptions?: Readable<IdAndName[]>;
}

export interface MapSettingConfigText extends MapSettingConfigBase {
	id: StringMapSettings;
	type: 'text';
}

export type MapSettingConfig =
	| MapSettingConfigText
	| MapSettingConfigToggle
	| MapSettingConfigNumber
	| MapSettingConfigRange
	| MapSettingConfigSelect;

export interface MapSettingGroup extends IdAndName {
	settings: MapSettingConfig[];
}

const fontOptions = readable<IdAndName[]>([], (set) => {
	loadFonts().then((fonts) => set(fonts.map((f) => ({ id: f, name: f }))));
});

const iconOptions: IdAndName[] = [
	{ id: 'none', name: 'None' },
	{ id: 'circle', name: 'Circle' },
	{ id: 'cross', name: 'Cross' },
	{ id: 'diamond', name: 'Diamond' },
	{ id: 'square', name: 'Square' },
	{ id: 'star', name: 'Star' },
	{ id: 'triangle', name: 'Triangle' },
	{ id: 'wye', name: 'Y' },
];

const colorOptions: IdAndName[] = [
	{ id: 'primary', name: 'Primary' },
	{ id: 'secondary', name: 'Secondary' },
	{ id: 'white', name: 'White' },
];

export const mapSettingConfig: MapSettingGroup[] = [
	{
		id: 'borders',
		name: 'Country Borders',
		settings: [
			{
				id: 'borderFillColor',
				name: 'Fill Color',
				type: 'select',
				options: colorOptions,
			},
			{
				id: 'borderColor',
				name: 'Border Color',
				type: 'select',
				options: colorOptions,
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
				id: 'countryNamesFont',
				name: 'Font',
				requiresReprocessing: true,
				type: 'select',
				options: [{ id: 'system', name: 'system' }],
				dynamicOptions: fontOptions,
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
			{
				id: 'labelsAvoidHoles',
				name: 'Avoid Holes in Border',
				requiresReprocessing: true,
				type: 'select',
				options: [
					{ id: 'all', name: 'All' },
					{ id: 'owned', name: 'Owned' },
					{ id: 'none', name: 'None' },
				],
				hideIf: (settings) => !settings.countryNames && !settings.countryEmblems,
			},
		],
	},
	{
		id: 'sectorBorders',
		name: 'Sector Borders',
		settings: [
			{
				id: 'sectorBorders',
				name: 'Sector Borders',
				type: 'toggle',
			},
			{
				id: 'sectorBorderColor',
				name: 'Color',
				type: 'select',
				options: colorOptions,
				hideIf: (settings) => !settings.sectorBorders,
			},
			{
				id: 'sectorBorderWidth',
				name: 'Width',
				type: 'number',
				min: 0,
				step: 0.5,
				hideIf: (settings) => !settings.sectorBorders,
			},
			{
				id: 'sectorBorderMinContrast',
				name: 'Minimum Contrast',
				type: 'range',
				min: 0,
				max: 1,
				step: 0.05,
				hideIf: (settings) => !settings.sectorBorders,
			},
			{
				id: 'sectorBorderDashArray',
				name: 'Dash Array',
				type: 'text',
				hideIf: (settings) => !settings.sectorBorders,
			},
			{
				id: 'sectorBorderSmoothing',
				name: 'Smoothing',
				type: 'toggle',
				requiresReprocessing: true,
				hideIf: (settings) => !settings.sectorBorders,
			},
		],
	},
	{
		id: 'systemIcons',
		name: 'System Icons',
		settings: [
			{
				id: 'countryCapitalIcon',
				name: 'Country Capital',
				type: 'select',
				options: iconOptions,
			},
			{
				id: 'countryCapitalIconSize',
				name: 'Country Capital Size',
				type: 'number',
				min: 0,
				step: 1,
				hideIf: (settings) => settings.countryCapitalIcon === 'none',
			},
			{
				id: 'sectorCapitalIcon',
				name: 'Sector Capital',
				type: 'select',
				options: iconOptions,
			},
			{
				id: 'sectorCapitalIconSize',
				name: 'Sector Capital Size',
				type: 'number',
				min: 0,
				step: 1,
				hideIf: (settings) => settings.sectorCapitalIcon === 'none',
			},
			{
				id: 'populatedSystemIcon',
				name: 'Populated System',
				type: 'select',
				options: iconOptions,
			},
			{
				id: 'populatedSystemIconSize',
				name: 'Populated System Size',
				type: 'number',
				min: 0,
				step: 1,
				hideIf: (settings) => settings.populatedSystemIcon === 'none',
			},
			{
				id: 'populatedSystemIconColor',
				name: 'Color',
				type: 'select',
				options: colorOptions,
				hideIf: (settings) =>
					settings.countryCapitalIcon === 'none' &&
					settings.sectorCapitalIcon === 'none' &&
					settings.populatedSystemIcon === 'none',
			},
			{
				id: 'populatedSystemIconMinContrast',
				name: 'Minimum Contrast',
				type: 'range',
				min: 0,
				max: 1,
				step: 0.05,
				hideIf: (settings) =>
					settings.countryCapitalIcon === 'none' &&
					settings.sectorCapitalIcon === 'none' &&
					settings.populatedSystemIcon === 'none',
			},
		],
	},
	{
		id: 'starIcons',
		name: 'Stars',
		settings: [
			{
				id: 'unpopulatedSystemIcon',
				name: 'Icon',
				type: 'select',
				options: iconOptions,
			},
			{
				id: 'unpopulatedSystemIconSize',
				name: 'Icon Size',
				type: 'number',
				min: 0,
				step: 1,
				hideIf: (settings) => settings.unpopulatedSystemIcon === 'none',
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
	borderWidth: 4,
	borderSmoothing: true,
	hyperlaneWidth: 1,
	hyperlaneOpacity: 0.1,
	hyperRelayWidth: 3,
	hyperRelayOpacity: 0.1,
	countryNames: true,
	countryNamesMinSize: 10,
	countryNamesMaxSize: null,
	countryNamesFont: 'system',
	countryEmblems: true,
	countryEmblemsMinSize: null,
	countryEmblemsMaxSize: null,
	labelsAvoidHoles: 'owned',
	sectorBorders: true,
	sectorBorderSmoothing: true,
	sectorBorderWidth: 1,
	sectorBorderColor: 'secondary',
	sectorBorderMinContrast: 0.1,
	sectorBorderDashArray: '2 1',
	countryCapitalIcon: 'diamond',
	countryCapitalIconSize: 15,
	sectorCapitalIcon: 'triangle',
	sectorCapitalIconSize: 10,
	populatedSystemIcon: 'square',
	populatedSystemIconSize: 5,
	populatedSystemIconColor: 'secondary',
	populatedSystemIconMinContrast: 0.3,
	unpopulatedSystemIcon: 'circle',
	unpopulatedSystemIconSize: 1,
};

export const mapSettings = writable(defaultMapSettings);
export const lastProcessedMapSettings = writable(defaultMapSettings);
export const reprocessMap = () => lastProcessedMapSettings.set(get(mapSettings));
