import { get, writable, type Readable, readable, derived } from 'svelte/store';
import { loadFonts } from './tauriCommands';
import { stellarisDataPromiseStore } from './loadStellarisData';
import { localStorageStore } from '@skeletonlabs/skeleton';
import * as R from 'rambda';

export type NumberMapSettings = 'unionLeaderSymbolSize' | 'terraIncognitaBrightness';

export type NumberOptionalMapSettings =
	| 'countryEmblemsMaxSize'
	| 'countryEmblemsMinSize'
	| 'countryNamesMaxSize'
	| 'countryNamesMinSize';

export type StringMapSettings =
	| 'labelsAvoidHoles'
	| 'countryNamesFont'
	| 'unionFederations'
	| 'unionSubjects'
	| 'unionLeaderSymbol'
	| 'terraIncognitaPerspectiveCountry'
	| 'terraIncognitaStyle';

export type BooleanMapSettings =
	| 'alignStarsToGrid'
	| 'circularGalaxyBorders'
	| 'countryEmblems'
	| 'countryNames'
	| 'hyperlaneMetroStyle'
	| 'terraIncognita'
	| 'unionLeaderUnderline'
	| 'unionMode';

export interface ColorSetting {
	color: string;
	colorAdjustments: ColorSettingAdjustment[];
}

export interface ColorSettingAdjustment {
	type?: ColorSettingAdjustmentType;
	value: number;
}

export type ColorSettingAdjustmentType =
	| 'LIGHTEN'
	| 'DARKEN'
	| 'MIN_LIGHTNESS'
	| 'MAX_LIGHTNESS'
	| 'MIN_CONTRAST'
	| 'OPACITY';

export const COLOR_SETTING_ADJUSTMENT_TYPES: ColorSettingAdjustmentType[] = [
	'LIGHTEN',
	'DARKEN',
	'MIN_LIGHTNESS',
	'MAX_LIGHTNESS',
	'OPACITY',
	'MIN_CONTRAST',
];

export type ColorMapSettings =
	| 'backgroundColor'
	| 'borderColor'
	| 'borderFillColor'
	| 'hyperlaneColor'
	| 'hyperRelayColor'
	| 'sectorBorderColor'
	| 'unownedHyperlaneColor'
	| 'unownedHyperRelayColor'
	| 'wormholeStrokeColor';

export interface StrokeSetting {
	enabled: boolean;
	width: number;
	smoothing: boolean;
	dashed: boolean;
	dashArray: string;
	glow: boolean;
}

export type StrokeMapSettings =
	| 'borderStroke'
	| 'unionBorderStroke'
	| 'sectorBorderStroke'
	| 'hyperlaneStroke'
	| 'hyperRelayStroke'
	| 'wormholeStroke';

export type IconPosition = 'left' | 'right' | 'top' | 'bottom' | 'center';
export const ICON_POSITIONS = ['left', 'right', 'top', 'bottom', 'center'];
export interface IconSetting {
	enabled: boolean;
	icon: string;
	size: number;
	position: IconPosition;
	priority: number;
	color: ColorSetting;
}

export type IconMapSettings =
	| 'countryCapitalIcon'
	| 'sectorCapitalIcon'
	| 'populatedSystemIcon'
	| 'unpopulatedSystemIcon'
	| 'wormholeIcon';

export type MapSettings = Record<NumberMapSettings, number> &
	Record<NumberOptionalMapSettings, number | null> &
	Record<StringMapSettings, string> &
	Record<BooleanMapSettings, boolean> &
	Record<ColorMapSettings, ColorSetting> &
	Record<StrokeMapSettings, StrokeSetting> &
	Record<IconMapSettings, IconSetting>;

export interface IdAndName {
	id: string;
	name: string;
}

type RequiresReprocessingFunc<T> = (prev: T, next: T) => boolean;

interface MapSettingConfigBase extends IdAndName {
	requiresReprocessing?: boolean | RequiresReprocessingFunc<any>; // eslint-disable-line @typescript-eslint/no-explicit-any
	hideIf?: (settings: MapSettings) => boolean;
}

export interface MapSettingConfigToggle extends MapSettingConfigBase {
	id: BooleanMapSettings;
	type: 'toggle';
	requiresReprocessing?: boolean | RequiresReprocessingFunc<boolean>;
}

export interface MapSettingConfigNumber extends MapSettingConfigBase {
	id: NumberMapSettings | NumberOptionalMapSettings;
	type: 'number';
	requiresReprocessing?: boolean | RequiresReprocessingFunc<null | number>;
	min?: number;
	max?: number;
	step: number;
	optional?: boolean;
}

export interface MapSettingConfigRange extends MapSettingConfigBase {
	id: NumberMapSettings | NumberOptionalMapSettings;
	type: 'range';
	requiresReprocessing?: boolean | RequiresReprocessingFunc<null | number>;
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
	requiresReprocessing?: boolean | RequiresReprocessingFunc<string>;
	options: SelectOption[];
	dynamicOptions?: Readable<SelectOption[]>;
}

export interface MapSettingConfigText extends MapSettingConfigBase {
	id: StringMapSettings;
	type: 'text';
	requiresReprocessing?: boolean | RequiresReprocessingFunc<string>;
}

export interface MapSettingConfigColor extends MapSettingConfigBase {
	id: ColorMapSettings;
	type: 'color';
	requiresReprocessing?: boolean | RequiresReprocessingFunc<ColorSetting>;
	allowedAdjustments?: ColorSettingAdjustmentType[];
	allowedDynamicColors?: ('primary' | 'secondary' | 'border')[];
}

export interface MapSettingConfigStroke extends MapSettingConfigBase {
	id: StrokeMapSettings;
	type: 'stroke';
	requiresReprocessing?: boolean | RequiresReprocessingFunc<StrokeSetting>;
	noSmoothing?: boolean;
	noDashed?: boolean;
}

export interface MapSettingConfigIcon extends MapSettingConfigBase {
	id: IconMapSettings;
	type: 'icon';
	requiresReprocessing?: boolean | RequiresReprocessingFunc<IconSetting>;
}

export type MapSettingConfig =
	| MapSettingConfigText
	| MapSettingConfigToggle
	| MapSettingConfigNumber
	| MapSettingConfigRange
	| MapSettingConfigSelect
	| MapSettingConfigColor
	| MapSettingConfigStroke
	| MapSettingConfigIcon;

export interface MapSettingGroup extends IdAndName {
	settings: MapSettingConfig[];
}

const fontOptions = readable<IdAndName[]>([], (set) => {
	loadFonts().then((fonts) =>
		set(fonts.filter((f) => f !== 'Orbitron').map((f) => ({ id: f, name: f }))),
	);
});

export const countryOptions = writable<IdAndName[]>([]);

export const emptyOptions = readable<IdAndName[]>([]);

export const glyphOptions: SelectOption[] = [
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

export const iconOptions: SelectOption[] = [
	{ group: 'Basic Shapes', id: 'icon-circle', name: 'Circle' },
	{ group: 'Basic Shapes', id: 'icon-square', name: 'Square' },
	{ group: 'Basic Shapes', id: 'icon-diamond', name: 'Diamond' },
	{ group: 'Basic Shapes', id: 'icon-cross', name: 'Cross' },
	{ group: 'Basic Shapes', id: 'icon-triangle', name: 'Triangle' },
	{ group: 'Stellaris', id: 'icon-wormhole', name: 'Wormhole' },
];

export const colorOptions: SelectOption[] = [
	{ id: 'primary', name: 'Primary', group: 'Dynamic Colors' },
	{ id: 'secondary', name: 'Secondary', group: 'Dynamic Colors' },
	{ id: 'border', name: 'Border', group: 'Dynamic Colors' },
];

export const colorDynamicOptions = derived<typeof stellarisDataPromiseStore, SelectOption[]>(
	stellarisDataPromiseStore,
	(stellarisDataPromise, set) => {
		stellarisDataPromise.then(({ colors }) =>
			set(
				Object.keys(colors).map((c) => ({
					id: c,
					group: ['very_black', 'true_black'].includes(c)
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
	{ id: 'joinedBorders', name: 'Joined Borders' },
	{ id: 'separateBorders', name: 'Separate Borders' },
	{ id: 'off', name: 'Off' },
];

export const mapSettingConfig: MapSettingGroup[] = [
	{
		id: 'borders',
		name: 'Borders',
		settings: [
			{
				id: 'borderStroke',
				name: 'Country Borders',
				type: 'stroke',
				noDashed: true,
				requiresReprocessing: (prev, next) =>
					prev.width !== next.width || prev.smoothing !== next.smoothing,
			},
			{
				id: 'borderColor',
				name: 'Country Border Color',
				type: 'color',
				allowedDynamicColors: ['primary', 'secondary'],
				hideIf: (settings) => !settings.borderStroke.enabled,
			},
			{
				id: 'borderFillColor',
				name: 'Country Fill Color',
				type: 'color',
				hideIf: (settings) => !settings.borderStroke.enabled,
			},
			{
				id: 'sectorBorderStroke',
				name: 'Sector Borders',
				type: 'stroke',
				requiresReprocessing: (prev, next) => prev.smoothing !== next.smoothing,
			},
			{
				id: 'sectorBorderColor',
				name: 'Sector Border Color',
				type: 'color',
				hideIf: (settings) => !settings.sectorBorderStroke.enabled,
			},
			{
				id: 'unionBorderStroke',
				name: 'Union Borders',
				type: 'stroke',
				requiresReprocessing: (prev, next) => prev.smoothing !== next.smoothing,
				hideIf: (settings) =>
					!settings.unionMode ||
					(settings.unionFederations === 'off' && settings.unionSubjects === 'off'),
			},
		],
	},
	{
		id: 'unions',
		name: 'Union Mode',
		settings: [
			{
				id: 'unionMode',
				name: 'Union Mode',
				type: 'toggle',
				requiresReprocessing: true,
			},
			{
				id: 'unionFederations',
				name: 'Federations',
				requiresReprocessing: true,
				type: 'select',
				options: unionOptions,
				hideIf: (settings) => !settings.unionMode,
			},
			{
				id: 'unionSubjects',
				name: 'Subjects',
				requiresReprocessing: true,
				type: 'select',
				options: unionOptions,
				hideIf: (settings) => !settings.unionMode,
			},
			{
				id: 'unionLeaderSymbol',
				name: 'Union Leader Symbol',
				type: 'select',
				options: glyphOptions,
				hideIf: (settings) => !settings.unionMode || !settings.countryEmblems,
			},
			{
				id: 'unionLeaderSymbolSize',
				name: 'Union Leader Symbol Size',
				type: 'range',
				min: 0.05,
				max: 1,
				step: 0.05,
				hideIf: (settings) =>
					!settings.unionMode || !settings.countryEmblems || settings.unionLeaderSymbol === 'none',
			},
			{
				id: 'unionLeaderUnderline',
				name: 'Underline Union Leader Name',
				type: 'toggle',
				hideIf: (settings) => !settings.unionMode || !settings.countryNames,
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
		id: 'systemIcons',
		name: 'System Icons',
		settings: [
			{
				id: 'countryCapitalIcon',
				name: 'Country Capital',
				type: 'icon',
			},
			{
				id: 'sectorCapitalIcon',
				name: 'Sector Capital',
				type: 'icon',
			},
			{
				id: 'populatedSystemIcon',
				name: 'Populated System',
				type: 'icon',
			},
			{
				id: 'unpopulatedSystemIcon',
				name: 'Other System',
				type: 'icon',
			},
			{
				id: 'wormholeIcon',
				name: 'Wormole',
				type: 'icon',
			},
		],
	},
	{
		id: 'hyperlanes',
		name: 'Hyperlanes',
		settings: [
			{
				id: 'hyperlaneStroke',
				name: 'Hyperlanes',
				type: 'stroke',
				noSmoothing: true,
			},
			{
				id: 'hyperlaneColor',
				name: 'Hyperlane Color',
				type: 'color',
				hideIf: (settings) => !settings.hyperlaneStroke.enabled,
			},
			{
				id: 'unownedHyperlaneColor',
				name: 'Unowned Hyperlane Color',
				type: 'color',
				allowedDynamicColors: [],
				hideIf: (settings) =>
					!settings.hyperlaneStroke.enabled ||
					!isColorDynamic(settings.hyperlaneColor.color, settings),
			},
			{
				id: 'hyperRelayStroke',
				name: 'Hyper Relays',
				type: 'stroke',
				noSmoothing: true,
			},
			{
				id: 'hyperRelayColor',
				name: 'Hyper Relay Color',
				type: 'color',
				hideIf: (settings) => !settings.hyperRelayStroke.enabled,
			},
			{
				id: 'unownedHyperRelayColor',
				name: 'Unowned Hyper Relay Color',
				type: 'color',
				allowedDynamicColors: [],
				hideIf: (settings) =>
					!settings.hyperRelayStroke.enabled ||
					!isColorDynamic(settings.hyperRelayColor.color, settings),
			},
			{
				id: 'hyperlaneMetroStyle',
				name: 'Metro-style Hyperlanes',
				type: 'toggle',
				requiresReprocessing: true,
				hideIf: (settings) =>
					!settings.hyperlaneStroke.enabled && !settings.hyperRelayStroke.enabled,
			},
		],
	},
	{
		id: 'bypassLinks',
		name: 'Bypass Links',
		settings: [
			{
				id: 'wormholeStroke',
				name: 'Wormhole Links',
				type: 'stroke',
				noSmoothing: true,
			},
			{
				id: 'wormholeStrokeColor',
				name: 'Wormhole Links Color',
				type: 'color',
				allowedDynamicColors: [],
				hideIf: (settings) => !settings.wormholeStroke.enabled,
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
		id: 'misc',
		name: 'Miscellaneous',
		settings: [
			{
				id: 'backgroundColor',
				name: 'Background Color',
				type: 'color',
				allowedDynamicColors: [],
				allowedAdjustments: ['LIGHTEN', 'DARKEN', 'MIN_LIGHTNESS', 'MAX_LIGHTNESS'],
			},
			{
				id: 'alignStarsToGrid',
				name: 'Align Solar Systems to Grid',
				type: 'toggle',
				requiresReprocessing: true,
			},
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
	backgroundColor: { color: 'very_black', colorAdjustments: [] },
	borderFillColor: { color: 'secondary', colorAdjustments: [{ type: 'OPACITY', value: 0.5 }] },
	borderColor: { color: 'primary', colorAdjustments: [] },
	borderStroke: {
		enabled: true,
		width: 2,
		smoothing: true,
		glow: false,
		dashed: false,
		dashArray: '3 3',
	},
	hyperlaneStroke: {
		enabled: true,
		width: 0.5,
		smoothing: false,
		glow: false,
		dashed: false,
		dashArray: '3 3',
	},
	hyperlaneColor: { color: 'white', colorAdjustments: [{ type: 'OPACITY', value: 0.15 }] },
	unownedHyperlaneColor: { color: 'primary', colorAdjustments: [{ type: 'OPACITY', value: 0.15 }] },
	hyperRelayStroke: {
		enabled: true,
		width: 0.5,
		smoothing: false,
		glow: false,
		dashed: false,
		dashArray: '3 3',
	},
	hyperRelayColor: { color: 'white', colorAdjustments: [{ type: 'OPACITY', value: 0.15 }] },
	unownedHyperRelayColor: { color: 'white', colorAdjustments: [{ type: 'OPACITY', value: 0.15 }] },
	countryNames: true,
	countryNamesMinSize: 5,
	countryNamesMaxSize: null,
	countryNamesFont: 'Orbitron',
	countryEmblems: true,
	countryEmblemsMinSize: null,
	countryEmblemsMaxSize: 75,
	labelsAvoidHoles: 'owned',
	sectorBorderStroke: {
		enabled: true,
		width: 1,
		smoothing: true,
		glow: false,
		dashed: true,
		dashArray: '3 3',
	},
	sectorBorderColor: { color: 'border', colorAdjustments: [{ type: 'MIN_CONTRAST', value: 0.25 }] },
	countryCapitalIcon: {
		enabled: true,
		icon: 'icon-diamond',
		size: 8,
		position: 'center',
		priority: 40,
		color: { color: 'border', colorAdjustments: [{ type: 'MIN_CONTRAST', value: 0.5 }] },
	},
	sectorCapitalIcon: {
		enabled: true,
		icon: 'icon-triangle',
		size: 6,
		position: 'center',
		priority: 30,
		color: { color: 'border', colorAdjustments: [{ type: 'MIN_CONTRAST', value: 0.5 }] },
	},
	populatedSystemIcon: {
		enabled: true,
		icon: 'icon-square',
		size: 2,
		position: 'center',
		priority: 20,
		color: { color: 'border', colorAdjustments: [{ type: 'MIN_CONTRAST', value: 0.5 }] },
	},
	unpopulatedSystemIcon: {
		enabled: true,
		icon: 'icon-circle',
		size: 1,
		position: 'center',
		priority: 10,
		color: { color: 'white', colorAdjustments: [] },
	},
	wormholeIcon: {
		enabled: true,
		icon: 'icon-wormhole',
		size: 10,
		position: 'right',
		priority: 10,
		color: { color: 'intense_purple', colorAdjustments: [{ type: 'MIN_CONTRAST', value: 0.5 }] },
	},
	unionMode: false,
	unionFederations: 'joinedBorders',
	unionSubjects: 'joinedBorders',
	unionLeaderSymbol: '✶',
	unionLeaderSymbolSize: 0.3,
	unionLeaderUnderline: true,
	unionBorderStroke: {
		enabled: true,
		width: 2,
		smoothing: true,
		glow: false,
		dashed: false,
		dashArray: '3 3',
	},
	terraIncognita: true,
	terraIncognitaPerspectiveCountry: 'player',
	terraIncognitaStyle: 'striped',
	terraIncognitaBrightness: 50,
	circularGalaxyBorders: false,
	alignStarsToGrid: false,
	hyperlaneMetroStyle: false,
	wormholeStroke: {
		enabled: false,
		width: 1,
		smoothing: false,
		glow: false,
		dashed: false,
		dashArray: '3 3',
	},
	wormholeStrokeColor: {
		color: 'intense_purple',
		colorAdjustments: [],
	},
};

export const mapSettings = localStorageStore('mapSettings', defaultMapSettings);
export const lastProcessedMapSettings = localStorageStore(
	'lastProcessedMapSettings',
	defaultMapSettings,
);
export const reprocessMap = () => lastProcessedMapSettings.set(get(mapSettings));

export interface SavedMapSettings {
	name: string;
	settings: MapSettings;
}

export const presetMapSettings: SavedMapSettings[] = [
	{
		name: 'Default',
		settings: defaultMapSettings,
	},
	{
		name: 'Unions',
		settings: {
			...defaultMapSettings,
			unionMode: true,
		},
	},
	{
		name: 'Circular',
		settings: {
			...defaultMapSettings,
			circularGalaxyBorders: true,
		},
	},
	{
		name: 'Light Borders',
		settings: {
			...defaultMapSettings,
			borderColor: {
				color: 'secondary',
				colorAdjustments: [{ type: 'MIN_LIGHTNESS', value: 0.75 }],
			},
			borderFillColor: {
				color: 'secondary',
				colorAdjustments: [
					{
						type: 'MAX_LIGHTNESS',
						value: 0.15,
					},
					{ type: 'OPACITY', value: 0.5 },
				],
			},
			backgroundColor: {
				color: 'true_black',
				colorAdjustments: [],
			},
			borderStroke: {
				...defaultMapSettings.borderStroke,
				glow: true,
			},
			sectorBorderStroke: {
				...defaultMapSettings.sectorBorderStroke,
				glow: true,
			},
			unionBorderStroke: {
				...defaultMapSettings.unionBorderStroke,
				glow: true,
			},
			countryNames: false,
		},
	},
	{
		name: 'Relay Metro Map',
		settings: {
			...defaultMapSettings,
			alignStarsToGrid: true,
			hyperlaneMetroStyle: true,
			hyperlaneStroke: {
				...defaultMapSettings.hyperlaneStroke,
				width: 0.5,
				dashed: true,
				dashArray: '0.5 1',
			},
			hyperRelayStroke: {
				...defaultMapSettings.hyperRelayStroke,
				width: 4,
			},
			hyperRelayColor: {
				color: 'secondary',
				colorAdjustments: [{ type: 'MIN_LIGHTNESS', value: 0.85 }],
			},
			borderColor: { color: 'very_black', colorAdjustments: [] },
			borderFillColor: {
				color: 'secondary',
				colorAdjustments: [
					{ type: 'MIN_LIGHTNESS', value: 0.15 },
					{ type: 'OPACITY', value: 0.25 },
				],
			},
			backgroundColor: { color: 'very_black', colorAdjustments: [] },
			borderStroke: {
				...defaultMapSettings.borderStroke,
				smoothing: false,
			},
			sectorBorderStroke: {
				...defaultMapSettings.sectorBorderStroke,
				width: 1,
				smoothing: false,
				dashed: false,
			},
			sectorBorderColor: { color: 'border', colorAdjustments: [] },
			countryNames: false,
			countryEmblems: false,
			populatedSystemIcon: {
				...defaultMapSettings.populatedSystemIcon,
				icon: 'icon-circle',
				size: 2.5,
				position: 'center',
				color: {
					color: 'secondary',
					colorAdjustments: [
						{ type: 'MIN_LIGHTNESS', value: 0.4 },
						{ type: 'MAX_LIGHTNESS', value: 0.4 },
					],
				},
			},
			sectorCapitalIcon: {
				...defaultMapSettings.sectorCapitalIcon,
				icon: 'icon-circle',
				size: 4,
				position: 'center',
				color: {
					color: 'secondary',
					colorAdjustments: [
						{ type: 'MIN_LIGHTNESS', value: 0.4 },
						{ type: 'MAX_LIGHTNESS', value: 0.4 },
					],
				},
			},
			countryCapitalIcon: {
				...defaultMapSettings.countryCapitalIcon,
				enabled: false,
			},
			unpopulatedSystemIcon: {
				...defaultMapSettings.unpopulatedSystemIcon,
				size: 0.5,
			},
		},
	},
];

export function settingsAreDifferent(
	a: MapSettings,
	b: MapSettings,
	{ requiresReprocessingOnly = false } = {},
) {
	return mapSettingConfig
		.flatMap((group) => group.settings)
		.filter((setting) => !requiresReprocessingOnly || setting.requiresReprocessing)
		.some((setting) => {
			if (requiresReprocessingOnly && typeof setting.requiresReprocessing === 'function') {
				const settingType = setting.type;
				// switch is required for type inference
				switch (settingType) {
					case 'toggle':
						return setting.requiresReprocessing(a[setting.id], b[setting.id]);
					case 'color':
						return setting.requiresReprocessing(a[setting.id], b[setting.id]);
					case 'number':
						return setting.requiresReprocessing(a[setting.id], b[setting.id]);
					case 'range':
						return setting.requiresReprocessing(a[setting.id], b[setting.id]);
					case 'text':
						return setting.requiresReprocessing(a[setting.id], b[setting.id]);
					case 'select':
						return setting.requiresReprocessing(a[setting.id], b[setting.id]);
					case 'stroke':
						return setting.requiresReprocessing(a[setting.id], b[setting.id]);
					default:
						throw new Error(`Unhandled setting type: ${settingType}`);
				}
			}
			return !R.equals(a[setting.id], b[setting.id]);
		});
}

export function isColorDynamic(color: string, settings: MapSettings): boolean {
	return (
		['primary', 'secondary'].includes(color) ||
		(color === 'border' && isColorDynamic(settings.borderColor.color, settings))
	);
}
