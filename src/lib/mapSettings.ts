import { get, writable, type Readable, readable, derived } from 'svelte/store';
import { loadFonts } from './tauriCommands';
import { stellarisDataPromiseStore } from './loadStellarisData';

export type NumberMapSettings =
	| 'borderFillOpacity'
	| 'borderWidth'
	| 'sectorBorderWidth'
	| 'hyperlaneWidth'
	| 'hyperlaneOpacity'
	| 'unownedHyperlaneOpacity'
	| 'hyperRelayWidth'
	| 'hyperRelayOpacity'
	| 'unownedHyperRelayOpacity'
	| 'sectorBorderMinContrast'
	| 'countryCapitalIconSize'
	| 'sectorCapitalIconSize'
	| 'populatedSystemIconSize'
	| 'populatedSystemIconMinContrast'
	| 'unpopulatedSystemIconSize'
	| 'unionBorderWidth'
	| 'unionLeaderSymbolSize'
	| 'terraIncognitaBrightness';

export type NumberOptionalMapSettings =
	| 'countryEmblemsMaxSize'
	| 'countryEmblemsMinSize'
	| 'countryNamesMaxSize'
	| 'countryNamesMinSize';

export type StringMapSettings =
	| 'hyperlaneColor'
	| 'hyperRelayColor'
	| 'unownedHyperlaneColor'
	| 'unownedHyperRelayColor'
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
	| 'unpopulatedSystemIcon'
	| 'unionFederations'
	| 'unionSubjects'
	| 'unionLeaderSymbol'
	| 'terraIncognitaPerspectiveCountry'
	| 'terraIncognitaStyle';

export type BooleanMapSettings =
	| 'borderSmoothing'
	| 'countryEmblems'
	| 'countryNames'
	| 'sectorBorders'
	| 'sectorBorderSmoothing'
	| 'unionLeaderUnderline'
	| 'terraIncognita'
	| 'circularGalaxyBorders';

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

export interface SelectOption extends IdAndName {
	group?: string;
}

export interface MapSettingConfigSelect extends MapSettingConfigBase {
	id: StringMapSettings;
	type: 'select';
	options: SelectOption[];
	dynamicOptions?: Readable<SelectOption[]>;
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

export const countryOptions = writable<IdAndName[]>([]);

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

const textIconOptions: IdAndName[] = [
	{ id: 'none', name: 'None' },
	{ id: '✦', name: '✦ 4-Pointed Star' },
	{ id: '✧', name: '✧ 4-Pointed Star (outline)' },
	{ id: '★', name: '★ 5-Pointed Star' },
	{ id: '☆', name: '☆ 5-Pointed Star (outline)' },
	{ id: '✪', name: '✪ 5-Pointed Star (circled)' },
	{ id: '✯', name: '✯ 5-Pointed Star (pinwheel)' },
	{ id: '✶', name: '✶ 6-Pointed Star' },
	{ id: '✴', name: '✴ 8-Pointed Star' },
];

const colorOptions: SelectOption[] = [
	{ id: 'primary', name: 'Primary', group: 'Dynamic' },
	{ id: 'secondary', name: 'Secondary', group: 'Dynamic' },
];

const colorOptionsWithBorder: SelectOption[] = [
	{ id: 'border', name: 'Border', group: 'Dynamic Colors' },
	...colorOptions,
];

const colorDynamicOptions = derived<typeof stellarisDataPromiseStore, IdAndName[]>(
	stellarisDataPromiseStore,
	(stellarisDataPromise, set) => {
		stellarisDataPromise.then(({ colors }) =>
			set(
				Object.keys(colors).map((c) => ({
					id: c,
					group: ['fallback_light', 'fallback_dark'].includes(c)
						? 'StellarMaps Colors'
						: 'Stellaris Colors',
					name: c
						.split('_')
						.filter((word) => word.length > 0)
						.map((word) => `${word.substring(0, 1).toUpperCase()}${word.substring(1)}`)
						.join(' '),
				})),
			),
		);
	},
	[],
);

const unionOptions: IdAndName[] = [
	{ id: 'off', name: 'Off' },
	{ id: 'separateBorders', name: 'Shared Colors, Separate Borders' },
	{ id: 'joinedBorders', name: 'Shared Colors, Joined Borders' },
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
				dynamicOptions: colorDynamicOptions,
			},
			{
				id: 'borderFillOpacity',
				name: 'Fill Opacity',
				type: 'range',
				min: 0,
				max: 1,
				step: 0.05,
			},
			{
				id: 'borderColor',
				name: 'Border Color',
				type: 'select',
				options: colorOptions,
				dynamicOptions: colorDynamicOptions,
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
		id: 'unions',
		name: 'Unions Mode',
		settings: [
			{
				id: 'unionFederations',
				name: 'Federations',
				requiresReprocessing: true,
				type: 'select',
				options: unionOptions,
			},
			{
				id: 'unionSubjects',
				name: 'Subjects',
				requiresReprocessing: true,
				type: 'select',
				options: unionOptions,
			},
			{
				id: 'unionBorderWidth',
				name: 'Union Internal Border Width',
				type: 'number',
				min: 0,
				step: 0.5,
				hideIf: (settings) =>
					settings.unionFederations !== 'joinedBorders' &&
					settings.unionSubjects !== 'joinedBorders',
			},
			{
				id: 'unionLeaderSymbol',
				name: 'Union Leader Symbol',
				type: 'select',
				options: textIconOptions,
				hideIf: (settings) =>
					(settings.unionFederations === 'off' && settings.unionSubjects === 'off') ||
					!settings.countryEmblems,
			},
			{
				id: 'unionLeaderSymbolSize',
				name: 'Union Leader Symbol Size',
				type: 'range',
				min: 0.05,
				max: 1,
				step: 0.05,
				hideIf: (settings) =>
					(settings.unionFederations === 'off' && settings.unionSubjects === 'off') ||
					!settings.countryEmblems ||
					settings.unionLeaderSymbol === 'none',
			},
			{
				id: 'unionLeaderUnderline',
				name: 'Underline Union Leader Name',
				type: 'toggle',
				hideIf: (settings) =>
					(settings.unionFederations === 'off' && settings.unionSubjects === 'off') ||
					!settings.countryNames,
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
				options: [
					{ id: 'Orbitron', name: 'Orbitron' },
					{ id: 'sans-serif', name: 'Sans-Serif' },
					{ id: 'serif', name: 'Serif' },
				],
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
				options: colorOptionsWithBorder,
				dynamicOptions: colorDynamicOptions,
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
				options: colorOptionsWithBorder,
				dynamicOptions: colorDynamicOptions,
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
				id: 'hyperlaneColor',
				name: 'Hyperlane Color',
				type: 'select',
				options: colorOptions,
				dynamicOptions: colorDynamicOptions,
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
				id: 'unownedHyperlaneColor',
				name: 'Unowned Hyperlane Color',
				type: 'select',
				options: colorOptions,
				dynamicOptions: colorDynamicOptions,
				hideIf: (settings) => !['primary', 'secondary'].includes(settings.hyperlaneColor),
			},
			{
				id: 'unownedHyperlaneOpacity',
				name: 'Unowned Hyperlane Opacity',
				type: 'range',
				min: 0,
				max: 1,
				step: 0.05,
				hideIf: (settings) => !['primary', 'secondary'].includes(settings.hyperlaneColor),
			},
			{
				id: 'hyperRelayWidth',
				name: 'Hyper Relay Width',
				type: 'number',
				min: 0,
				step: 0.5,
			},
			{
				id: 'hyperRelayColor',
				name: 'Hyper Relay Color',
				type: 'select',
				options: colorOptions,
				dynamicOptions: colorDynamicOptions,
			},
			{
				id: 'hyperRelayOpacity',
				name: 'Hyper Relay Opacity',
				type: 'range',
				min: 0,
				max: 1,
				step: 0.05,
			},
			{
				id: 'unownedHyperRelayColor',
				name: 'Unowned Hyper Relay Color',
				type: 'select',
				options: colorOptions,
				dynamicOptions: colorDynamicOptions,
				hideIf: (settings) => !['primary', 'secondary'].includes(settings.hyperRelayColor),
			},
			{
				id: 'unownedHyperRelayOpacity',
				name: 'Unowned Hyper Relay Opacity',
				type: 'range',
				min: 0,
				max: 1,
				step: 0.05,
				hideIf: (settings) => !['primary', 'secondary'].includes(settings.hyperRelayColor),
			},
		],
	},
	{
		id: 'terraIncognita',
		name: 'Terra Incognita',
		settings: [
			{
				id: 'terraIncognita',
				name: 'Terra Incognita',
				type: 'toggle',
			},
			{
				id: 'terraIncognitaPerspectiveCountry',
				name: 'Perspective Country',
				requiresReprocessing: true,
				type: 'select',
				options: [{ id: 'player', name: 'Player' }],
				dynamicOptions: countryOptions,
				hideIf: (settings) => !settings.terraIncognita,
			},
			{
				id: 'terraIncognitaStyle',
				name: 'Style',
				type: 'select',
				options: [
					{ id: 'flat', name: 'Flat' },
					{ id: 'striped', name: 'Striped' },
					{ id: 'cloudy', name: 'Cloudy' },
				],
				hideIf: (settings) => !settings.terraIncognita,
			},
			{
				id: 'terraIncognitaBrightness',
				name: 'Brightness',
				type: 'range',
				min: 0,
				max: 255,
				step: 5,
				hideIf: (settings) => !settings.terraIncognita,
			},
		],
	},
	{
		id: 'experimental',
		name: 'Experimental',
		settings: [
			{
				id: 'circularGalaxyBorders',
				name: 'Circular Galaxy Borders',
				requiresReprocessing: true,
				type: 'toggle',
			},
		],
	},
];

export const defaultMapSettings: MapSettings = {
	borderFillColor: 'secondary',
	borderFillOpacity: 0.5,
	borderColor: 'primary',
	borderWidth: 2,
	borderSmoothing: true,
	hyperlaneWidth: 0.5,
	hyperlaneColor: 'white',
	hyperlaneOpacity: 0.15,
	unownedHyperlaneColor: 'white',
	unownedHyperlaneOpacity: 0.15,
	hyperRelayWidth: 1.5,
	hyperRelayColor: 'white',
	hyperRelayOpacity: 0.15,
	unownedHyperRelayColor: 'white',
	unownedHyperRelayOpacity: 0.15,
	countryNames: true,
	countryNamesMinSize: 5,
	countryNamesMaxSize: null,
	countryNamesFont: 'Orbitron',
	countryEmblems: true,
	countryEmblemsMinSize: null,
	countryEmblemsMaxSize: null,
	labelsAvoidHoles: 'owned',
	sectorBorders: true,
	sectorBorderSmoothing: true,
	sectorBorderWidth: 0.5,
	sectorBorderColor: 'border',
	sectorBorderMinContrast: 0.1,
	sectorBorderDashArray: '1 2',
	countryCapitalIcon: 'diamond',
	countryCapitalIconSize: 15,
	sectorCapitalIcon: 'triangle',
	sectorCapitalIconSize: 10,
	populatedSystemIcon: 'square',
	populatedSystemIconSize: 5,
	populatedSystemIconColor: 'border',
	populatedSystemIconMinContrast: 0.3,
	unpopulatedSystemIcon: 'circle',
	unpopulatedSystemIconSize: 1,
	unionFederations: 'off',
	unionSubjects: 'off',
	unionLeaderSymbol: '★',
	unionLeaderSymbolSize: 0.3,
	unionLeaderUnderline: true,
	unionBorderWidth: 1,
	terraIncognita: true,
	terraIncognitaPerspectiveCountry: 'player',
	terraIncognitaStyle: 'striped',
	terraIncognitaBrightness: 50,
	circularGalaxyBorders: false,
};

export const mapSettings = writable(defaultMapSettings);
export const lastProcessedMapSettings = writable(defaultMapSettings);
export const reprocessMap = () => lastProcessedMapSettings.set(get(mapSettings));
