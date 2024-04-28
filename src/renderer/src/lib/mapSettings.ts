import { localStorageStore } from '@skeletonlabs/skeleton';
import type { PrimitiveType } from 'intl-messageformat';
import * as R from 'rambda';
import { derived, get, readable, writable, type Readable } from 'svelte/store';
import { z } from 'zod';
import type { MessageID } from '../intl';
import { ADDITIONAL_COLORS } from './colors';
import { stellarisDataPromiseStore } from './loadStellarisData';
import stellarMapsApi from './stellarMapsApi';

type NumberMapSettings =
	| 'voronoiGridSize'
	| 'unionLeaderSymbolSize'
	| 'terraIncognitaBrightness'
	| 'borderFillFade'
	| 'claimVoidBorderThreshold';

type NumberOptionalMapSettings =
	| 'countryEmblemsMaxSize'
	| 'countryEmblemsMinSize'
	| 'countryNamesMaxSize'
	| 'countryNamesMinSize'
	| 'countryNamesSecondaryRelativeSize'
	| 'claimVoidMaxSize'
	| 'starScapeStarsCount';

type StringMapSettings =
	| 'labelsAvoidHoles'
	| 'countryNamesType'
	| 'countryNamesFont'
	| 'unionFederations'
	| 'unionFederationsColor'
	| 'unionSubjects'
	| 'unionLeaderSymbol'
	| 'terraIncognitaPerspectiveCountry'
	| 'terraIncognitaStyle';

type BooleanMapSettings =
	| 'hyperlaneSensitiveBorders'
	| 'alignStarsToGrid'
	| 'circularGalaxyBorders'
	| 'countryEmblems'
	| 'countryNames'
	| 'hyperlaneMetroStyle'
	| 'terraIncognita'
	| 'unionLeaderUnderline'
	| 'unionMode'
	| 'starScapeDust'
	| 'starScapeNebula'
	| 'starScapeCore'
	| 'starScapeStars';

const colorSettingSchema = z.object({
	color: z.string(),
	colorAdjustments: z.array(
		z.object({
			type: z
				.enum(['LIGHTEN', 'DARKEN', 'MIN_LIGHTNESS', 'MAX_LIGHTNESS', 'OPACITY', 'MIN_CONTRAST'])
				.nullish(),
			value: z.number().min(0).max(1),
		}),
	),
});
export type ColorSetting = z.infer<typeof colorSettingSchema>;
export type ColorSettingAdjustment = ColorSetting['colorAdjustments'][number];
export type ColorSettingAdjustmentType = NonNullable<ColorSettingAdjustment['type']>;
export const COLOR_SETTING_ADJUSTMENT_TYPES =
	colorSettingSchema.shape.colorAdjustments.element.shape.type.unwrap().unwrap().options;
type ColorMapSettings =
	| 'backgroundColor'
	| 'borderColor'
	| 'borderFillColor'
	| 'hyperlaneColor'
	| 'hyperRelayColor'
	| 'sectorBorderColor'
	| 'unownedHyperlaneColor'
	| 'unownedHyperRelayColor'
	| 'wormholeStrokeColor'
	| 'lGateStrokeColor'
	| 'shroudTunnelStrokeColor'
	| 'starScapeDustColor'
	| 'starScapeNebulaColor'
	| 'starScapeNebulaAccentColor'
	| 'starScapeCoreColor'
	| 'starScapeCoreAccentColor'
	| 'starScapeStarsColor';

const strokeSettingSchema = z.object({
	enabled: z.boolean(),
	width: z.number(),
	smoothing: z.boolean(),
	dashed: z.boolean(),
	dashArray: z.string(),
	glow: z.boolean(),
});
export type StrokeSetting = z.infer<typeof strokeSettingSchema>;
type StrokeMapSettings =
	| 'borderStroke'
	| 'unionBorderStroke'
	| 'sectorBorderStroke'
	| 'hyperlaneStroke'
	| 'hyperRelayStroke'
	| 'wormholeStroke'
	| 'lGateStroke'
	| 'shroudTunnelStroke';

const iconSettingSchema = z.object({
	enabled: z.boolean(),
	icon: z.string(),
	size: z.number(),
	position: z.enum(['left', 'right', 'top', 'bottom', 'center']),
	priority: z.number(),
	color: colorSettingSchema,
});
export type IconSetting = z.infer<typeof iconSettingSchema>;
export type IconPosition = IconSetting['position'];
export const ICON_POSITIONS = iconSettingSchema.shape.position.options;
export type IconMapSettings =
	| 'countryCapitalIcon'
	| 'sectorCapitalIcon'
	| 'populatedSystemIcon'
	| 'unpopulatedSystemIcon'
	| 'wormholeIcon'
	| 'gatewayIcon'
	| 'lGateIcon'
	| 'shroudTunnelIcon';

export type MapSettings = Record<NumberMapSettings, number> &
	Record<NumberOptionalMapSettings, number | null> &
	Record<StringMapSettings, string> &
	Record<BooleanMapSettings, boolean> &
	Record<ColorMapSettings, ColorSetting> &
	Record<StrokeMapSettings, StrokeSetting> &
	Record<IconMapSettings, IconSetting>;

type RequiresReprocessingFunc<T> = (prev: T, next: T) => boolean;

interface MapSettingConfigBase {
	requiresReprocessing?: boolean | RequiresReprocessingFunc<any>;
	hideIf?: (settings: MapSettings) => boolean;
	tooltip?: MessageID;
}

interface MapSettingConfigToggle extends MapSettingConfigBase {
	id: BooleanMapSettings;
	type: 'toggle';
	requiresReprocessing?: boolean | RequiresReprocessingFunc<boolean>;
}

interface MapSettingConfigNumber extends MapSettingConfigBase {
	id: NumberMapSettings | NumberOptionalMapSettings;
	type: 'number';
	requiresReprocessing?: boolean | RequiresReprocessingFunc<null | number>;
	min?: number;
	max?: number;
	step: number;
	optional?: boolean;
}

interface MapSettingConfigRange extends MapSettingConfigBase {
	id: NumberMapSettings | NumberOptionalMapSettings;
	type: 'range';
	requiresReprocessing?: boolean | RequiresReprocessingFunc<null | number>;
	min: number;
	max: number;
	step: number;
}

export type SelectOption =
	| {
			id: string;
			name: MessageID;
			literalName?: never;
			group?: MessageID;
	  }
	| {
			id: string;
			name?: never;
			literalName: string;
			group?: MessageID;
	  };

interface MapSettingConfigSelect extends MapSettingConfigBase {
	id: StringMapSettings;
	type: 'select';
	requiresReprocessing?: boolean | RequiresReprocessingFunc<string>;
	options: SelectOption[];
	dynamicOptions?: Readable<SelectOption[]>;
}

interface MapSettingConfigText extends MapSettingConfigBase {
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

interface MapSettingGroup {
	id: string;
	name: MessageID;
	settings: MapSettingConfig[];
}

const fontOptions = readable<SelectOption[]>([], (set) => {
	stellarMapsApi
		.loadFonts()
		.then((fonts) =>
			set(fonts.filter((f) => f !== 'Orbitron').map((f) => ({ id: f, literalName: f }))),
		);
});

export const countryOptions = writable<SelectOption[]>([]);

export const emptyOptions = readable<SelectOption[]>([]);

const glyphOptions: SelectOption[] = [
	{ id: 'none', name: 'option.glyph.none' },
	{ id: '✦', name: 'option.glyph.star_4_pointed' },
	{ id: '✧', name: 'option.glyph.star_4_pointed_outline' },
	{ id: '★', name: 'option.glyph.star_5_pointed' },
	{ id: '☆', name: 'option.glyph.star_5_pointed_outline' },
	{ id: '✪', name: 'option.glyph.star_5_pointed_circled' },
	{ id: '✯', name: 'option.glyph.star_5_pointed_pinwheel' },
	{ id: '✶', name: 'option.glyph.star_6_pointed' },
	{ id: '✴', name: 'option.glyph.star_8_pointed' },
];

export const iconOptions: SelectOption[] = [
	{ group: 'option.icon.group.basic_shape', id: 'icon-triangle', name: 'option.icon.triangle' },
	{
		group: 'option.icon.group.basic_shape',
		id: 'icon-triangle-flat',
		name: 'option.icon.triangle_flat',
	},
	{ group: 'option.icon.group.basic_shape', id: 'icon-diamond', name: 'option.icon.diamond' },
	{ group: 'option.icon.group.basic_shape', id: 'icon-square', name: 'option.icon.square' },
	{ group: 'option.icon.group.basic_shape', id: 'icon-pentagon', name: 'option.icon.pentagon' },
	{
		group: 'option.icon.group.basic_shape',
		id: 'icon-pentagon-flat',
		name: 'option.icon.pentagon_flat',
	},
	{ group: 'option.icon.group.basic_shape', id: 'icon-hexagon', name: 'option.icon.hexagon' },
	{
		group: 'option.icon.group.basic_shape',
		id: 'icon-hexagon-flat',
		name: 'option.icon.hexagon_flat',
	},
	{ group: 'option.icon.group.basic_shape', id: 'icon-heptagon', name: 'option.icon.heptagon' },
	{
		group: 'option.icon.group.basic_shape',
		id: 'icon-heptagon-flat',
		name: 'option.icon.heptagon_flat',
	},
	{ group: 'option.icon.group.basic_shape', id: 'icon-octagon', name: 'option.icon.octagon' },
	{
		group: 'option.icon.group.basic_shape',
		id: 'icon-octagon-flat',
		name: 'option.icon.octagon_flat',
	},
	{ group: 'option.icon.group.basic_shape', id: 'icon-circle', name: 'option.icon.circle' },
	{
		group: 'option.icon.group.stars',
		id: 'icon-3-pointed-star',
		name: 'option.icon.star_3_pointed',
	},
	{
		group: 'option.icon.group.stars',
		id: 'icon-4-pointed-star',
		name: 'option.icon.star_4_pointed',
	},
	{
		group: 'option.icon.group.stars',
		id: 'icon-5-pointed-star',
		name: 'option.icon.star_5_pointed',
	},
	{
		group: 'option.icon.group.stars',
		id: 'icon-6-pointed-star',
		name: 'option.icon.star_6_pointed',
	},
	{
		group: 'option.icon.group.stars',
		id: 'icon-7-pointed-star',
		name: 'option.icon.star_7_pointed',
	},
	{
		group: 'option.icon.group.stars',
		id: 'icon-8-pointed-star',
		name: 'option.icon.star_8_pointed',
	},
	{ group: 'option.icon.group.other_shapes', id: 'icon-cross', name: 'option.icon.cross' },
	{ group: 'option.icon.group.stellaris', id: 'icon-wormhole', name: 'option.icon.wormhole' },
	{ group: 'option.icon.group.stellaris', id: 'icon-gateway', name: 'option.icon.gateway' },
	{ group: 'option.icon.group.stellaris', id: 'icon-l-gate', name: 'option.icon.l_gate' },
	{
		group: 'option.icon.group.stellaris',
		id: 'icon-shroud-tunnel',
		name: 'option.icon.shroud_tunnel',
	},
];

export const colorOptions: SelectOption[] = [
	{ id: 'primary', name: 'option.color.primary', group: 'option.color.group.dynamic' },
	{ id: 'secondary', name: 'option.color.secondary', group: 'option.color.group.dynamic' },
	{ id: 'border', name: 'option.color.border', group: 'option.color.group.dynamic' },
];

export const colorDynamicOptions = derived<typeof stellarisDataPromiseStore, SelectOption[]>(
	stellarisDataPromiseStore,
	(stellarisDataPromise, set) => {
		stellarisDataPromise.then(({ colors }) =>
			set(
				Object.keys(colors).map((c) => ({
					id: c,
					group:
						c in ADDITIONAL_COLORS
							? 'option.color.group.stellar_maps'
							: 'option.color.group.stellaris',
					literalName: c
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

const unionOptions: SelectOption[] = [
	{ id: 'joinedBorders', name: 'option.union.joined_borders' },
	{ id: 'separateBorders', name: 'option.union.separate_borders' },
	{ id: 'off', name: 'option.union.off' },
];

export const mapSettingConfig: MapSettingGroup[] = [
	{
		id: 'borders',
		name: 'setting.group.borders',
		settings: [
			{
				id: 'borderStroke',
				type: 'stroke',
				noDashed: true,
				requiresReprocessing: (prev, next) =>
					prev.width !== next.width || prev.smoothing !== next.smoothing,
			},
			{
				id: 'borderColor',
				type: 'color',
				allowedDynamicColors: ['primary', 'secondary'],
				hideIf: (settings) => !settings.borderStroke.enabled,
			},
			{
				id: 'borderFillColor',
				type: 'color',
				hideIf: (settings) => !settings.borderStroke.enabled,
			},
			{
				id: 'borderFillFade',
				type: 'range',
				hideIf: (settings) => !settings.borderStroke.enabled,
				min: 0,
				max: 1,
				step: 0.05,
			},
			{
				id: 'sectorBorderStroke',
				type: 'stroke',
				requiresReprocessing: (prev, next) => prev.smoothing !== next.smoothing,
			},
			{
				id: 'sectorBorderColor',
				type: 'color',
				hideIf: (settings) => !settings.sectorBorderStroke.enabled,
			},
			{
				id: 'unionBorderStroke',
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
		name: 'setting.group.unions',
		settings: [
			{
				id: 'unionMode',
				type: 'toggle',
				requiresReprocessing: true,
			},
			{
				id: 'unionSubjects',
				requiresReprocessing: true,
				type: 'select',
				options: unionOptions,
				hideIf: (settings) => !settings.unionMode,
			},
			{
				id: 'unionFederations',
				requiresReprocessing: true,
				type: 'select',
				options: unionOptions,
				hideIf: (settings) => !settings.unionMode,
			},
			{
				id: 'unionFederationsColor',
				requiresReprocessing: true,
				type: 'select',
				options: [
					{ id: 'founder', name: 'option.union_federations_color.founder' },
					{ id: 'leader', name: 'option.union_federations_color.leader' },
				],
				hideIf: (settings) => !settings.unionMode || settings.unionFederations === 'off',
			},
			{
				id: 'unionLeaderSymbol',
				type: 'select',
				options: glyphOptions,
				hideIf: (settings) => !settings.unionMode || !settings.countryEmblems,
			},
			{
				id: 'unionLeaderSymbolSize',
				type: 'range',
				min: 0.05,
				max: 1,
				step: 0.05,
				hideIf: (settings) =>
					!settings.unionMode || !settings.countryEmblems || settings.unionLeaderSymbol === 'none',
			},
			{
				id: 'unionLeaderUnderline',
				type: 'toggle',
				hideIf: (settings) => !settings.unionMode || !settings.countryNames,
			},
		],
	},
	{
		id: 'countryLabels',
		name: 'setting.group.countryLabels',
		settings: [
			{
				id: 'countryNames',
				requiresReprocessing: true,
				type: 'toggle',
			},
			{
				id: 'countryNamesType',
				requiresReprocessing: true,
				type: 'select',
				options: [
					{
						id: 'countryOnly',
						name: 'option.country_names_type.country_only',
					},
					{
						id: 'playerOnly',
						name: 'option.country_names_type.player_only',
					},
					{
						id: 'countryThenPlayer',
						name: 'option.country_names_type.country_then_player',
					},
					{
						id: 'playerThenCountry',
						name: 'option.country_names_type.player_then_country',
					},
				],
			},
			{
				id: 'countryNamesMinSize',
				requiresReprocessing: true,
				type: 'number',
				min: 0,
				step: 1,
				optional: true,
				hideIf: (settings) => !settings.countryNames,
			},
			{
				id: 'countryNamesMaxSize',
				requiresReprocessing: true,
				type: 'number',
				min: 0,
				step: 1,
				optional: true,
				hideIf: (settings) => !settings.countryNames,
			},
			{
				id: 'countryNamesSecondaryRelativeSize',
				type: 'number',
				min: 0,
				step: 0.05,
				optional: true,
				hideIf: (settings) =>
					!['countryThenPlayer', 'playerThenCountry'].includes(settings.countryNamesType),
			},
			{
				id: 'countryNamesFont',
				requiresReprocessing: true,
				type: 'select',
				options: [{ id: 'Orbitron', literalName: 'Orbitron' }],
				dynamicOptions: fontOptions,
				hideIf: (settings) => !settings.countryNames,
			},
			{
				id: 'countryEmblems',
				requiresReprocessing: true,
				type: 'toggle',
			},
			{
				id: 'countryEmblemsMinSize',
				requiresReprocessing: true,
				type: 'number',
				min: 0,
				step: 1,
				optional: true,
				hideIf: (settings) => !settings.countryEmblems,
			},
			{
				id: 'countryEmblemsMaxSize',
				requiresReprocessing: true,
				type: 'number',
				min: 0,
				step: 1,
				optional: true,
				hideIf: (settings) => !settings.countryEmblems,
			},
			{
				id: 'labelsAvoidHoles',
				requiresReprocessing: true,
				type: 'select',
				options: [
					{ id: 'all', name: 'option.labels_avoid_holes.all' },
					{ id: 'owned', name: 'option.labels_avoid_holes.owned' },
					{ id: 'none', name: 'option.labels_avoid_holes.none' },
				],
				hideIf: (settings) => !settings.countryNames && !settings.countryEmblems,
			},
		],
	},
	{
		id: 'systemIcons',
		name: 'setting.group.systemIcons',
		settings: [
			{
				id: 'countryCapitalIcon',
				type: 'icon',
			},
			{
				id: 'sectorCapitalIcon',
				type: 'icon',
			},
			{
				id: 'populatedSystemIcon',
				type: 'icon',
			},
			{
				id: 'unpopulatedSystemIcon',
				type: 'icon',
			},
			{
				id: 'wormholeIcon',
				type: 'icon',
			},
			{
				id: 'gatewayIcon',
				type: 'icon',
			},
			{
				id: 'lGateIcon',
				type: 'icon',
			},
			{
				id: 'shroudTunnelIcon',
				type: 'icon',
			},
		],
	},
	{
		id: 'hyperlanes',
		name: 'setting.group.hyperlanes',
		settings: [
			{
				id: 'hyperlaneStroke',
				type: 'stroke',
				noSmoothing: true,
			},
			{
				id: 'hyperlaneColor',
				type: 'color',
				hideIf: (settings) => !settings.hyperlaneStroke.enabled,
			},
			{
				id: 'unownedHyperlaneColor',
				type: 'color',
				allowedDynamicColors: [],
				hideIf: (settings) =>
					!settings.hyperlaneStroke.enabled ||
					!isColorDynamic(settings.hyperlaneColor.color, settings),
			},
			{
				id: 'hyperRelayStroke',
				type: 'stroke',
				noSmoothing: true,
			},
			{
				id: 'hyperRelayColor',
				type: 'color',
				hideIf: (settings) => !settings.hyperRelayStroke.enabled,
			},
			{
				id: 'unownedHyperRelayColor',
				type: 'color',
				allowedDynamicColors: [],
				hideIf: (settings) =>
					!settings.hyperRelayStroke.enabled ||
					!isColorDynamic(settings.hyperRelayColor.color, settings),
			},
			{
				id: 'hyperlaneMetroStyle',
				type: 'toggle',
				requiresReprocessing: true,
				hideIf: (settings) =>
					!settings.hyperlaneStroke.enabled && !settings.hyperRelayStroke.enabled,
				tooltip: 'setting.hyperlaneMetroStyle_tooltip',
			},
		],
	},
	{
		id: 'bypassLinks',
		name: 'setting.group.bypassLinks',
		settings: [
			{
				id: 'wormholeStroke',
				type: 'stroke',
				noSmoothing: true,
			},
			{
				id: 'wormholeStrokeColor',
				type: 'color',
				allowedDynamicColors: [],
				hideIf: (settings) => !settings.wormholeStroke.enabled,
			},
			{
				id: 'lGateStroke',
				type: 'stroke',
				noSmoothing: true,
			},
			{
				id: 'lGateStrokeColor',
				type: 'color',
				allowedDynamicColors: [],
				hideIf: (settings) => !settings.lGateStroke.enabled,
			},
			{
				id: 'shroudTunnelStroke',
				type: 'stroke',
				noSmoothing: true,
			},
			{
				id: 'shroudTunnelStrokeColor',
				type: 'color',
				allowedDynamicColors: [],
				hideIf: (settings) => !settings.shroudTunnelStroke.enabled,
			},
		],
	},
	{
		id: 'terraIncognita',
		name: 'setting.group.terraIncognita',
		settings: [
			{
				id: 'terraIncognita',
				type: 'toggle',
			},
			{
				id: 'terraIncognitaPerspectiveCountry',
				requiresReprocessing: true,
				type: 'select',
				options: [{ id: 'player', name: 'option.terra_incognita_perspective_country.player' }],
				dynamicOptions: countryOptions,
				hideIf: (settings) => !settings.terraIncognita,
			},
			{
				id: 'terraIncognitaStyle',
				type: 'select',
				options: [
					{ id: 'flat', name: 'option.terra_incognita_style.flat' },
					{ id: 'striped', name: 'option.terra_incognita_style.striped' },
					{ id: 'cloudy', name: 'option.terra_incognita_style.cloudy' },
				],
				hideIf: (settings) => !settings.terraIncognita,
			},
			{
				id: 'terraIncognitaBrightness',
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
		name: 'setting.group.misc',
		settings: [
			{
				id: 'backgroundColor',
				type: 'color',
				allowedDynamicColors: [],
				allowedAdjustments: ['LIGHTEN', 'DARKEN', 'MIN_LIGHTNESS', 'MAX_LIGHTNESS'],
			},
			{
				id: 'alignStarsToGrid',
				type: 'toggle',
				requiresReprocessing: true,
				hideIf: (settings) => settings.hyperlaneMetroStyle,
			},
		],
	},
	{
		id: 'advancedBorder',
		name: 'setting.group.advancedBorder',
		settings: [
			{
				id: 'circularGalaxyBorders',
				requiresReprocessing: true,
				type: 'toggle',
				tooltip: 'setting.circularGalaxyBorders_tooltip',
			},
			{
				id: 'hyperlaneSensitiveBorders',
				requiresReprocessing: true,
				type: 'toggle',
				tooltip: 'setting.hyperlaneSensitiveBorders_tooltip',
				hideIf: (settings) => settings.hyperlaneMetroStyle || settings.alignStarsToGrid,
			},
			{
				id: 'voronoiGridSize',
				requiresReprocessing: true,
				type: 'number',
				step: 1,
				min: 1,
				tooltip: 'setting.voronoiGridSize_tooltip',
			},
			{
				id: 'claimVoidMaxSize',
				requiresReprocessing: true,
				type: 'number',
				step: 1,
				min: 0,
				optional: true,
				tooltip: 'setting.claimVoidMaxSize_tooltip',
			},
			{
				id: 'claimVoidBorderThreshold',
				requiresReprocessing: true,
				type: 'range',
				step: 0.05,
				min: 0,
				max: 1,
				tooltip: 'setting.claimVoidBorderThreshold_tooltip',
			},
		],
	},
	{
		id: 'starScape',
		name: 'setting.group.starscape',
		settings: [
			{
				id: 'starScapeDust',
				type: 'toggle',
			},
			{
				id: 'starScapeDustColor',
				type: 'color',
				allowedDynamicColors: [],
				hideIf: (settings) => !settings.starScapeDust,
			},
			{
				id: 'starScapeNebula',
				type: 'toggle',
			},
			{
				id: 'starScapeNebulaColor',
				type: 'color',
				allowedDynamicColors: [],
				hideIf: (settings) => !settings.starScapeNebula,
			},
			{
				id: 'starScapeNebulaAccentColor',
				type: 'color',
				allowedDynamicColors: [],
				hideIf: (settings) => !settings.starScapeNebula,
			},
			{
				id: 'starScapeCore',
				type: 'toggle',
			},
			{
				id: 'starScapeCoreColor',
				type: 'color',
				allowedDynamicColors: [],
				hideIf: (settings) => !settings.starScapeCore,
			},
			{
				id: 'starScapeCoreAccentColor',
				type: 'color',
				allowedDynamicColors: [],
				hideIf: (settings) => !settings.starScapeCore,
			},
			{
				id: 'starScapeStars',
				type: 'toggle',
			},
			{
				id: 'starScapeStarsColor',
				type: 'color',
				allowedDynamicColors: [],
				hideIf: (settings) => !settings.starScapeStars,
			},
			{
				id: 'starScapeStarsCount',
				type: 'number',
				min: 0,
				step: 1,
				hideIf: (settings) => !settings.starScapeStars,
			},
		],
	},
];

const defaultMapSettings: MapSettings = {
	backgroundColor: { color: 'very_black', colorAdjustments: [] },
	borderFillColor: {
		color: 'secondary',
		colorAdjustments: [{ type: 'OPACITY', value: 0.5 }],
	},
	borderFillFade: 0,
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
	hyperlaneColor: {
		color: 'white',
		colorAdjustments: [{ type: 'OPACITY', value: 0.15 }],
	},
	unownedHyperlaneColor: {
		color: 'white',
		colorAdjustments: [{ type: 'OPACITY', value: 0.15 }],
	},
	hyperRelayStroke: {
		enabled: true,
		width: 0.5,
		smoothing: false,
		glow: false,
		dashed: false,
		dashArray: '3 3',
	},
	hyperRelayColor: {
		color: 'white',
		colorAdjustments: [{ type: 'OPACITY', value: 0.15 }],
	},
	unownedHyperRelayColor: {
		color: 'white',
		colorAdjustments: [{ type: 'OPACITY', value: 0.15 }],
	},
	countryNames: true,
	countryNamesType: 'countryOnly',
	countryNamesMinSize: 5,
	countryNamesMaxSize: null,
	countryNamesSecondaryRelativeSize: 0.75,
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
	sectorBorderColor: {
		color: 'border',
		colorAdjustments: [{ type: 'MIN_CONTRAST', value: 0.25 }],
	},
	countryCapitalIcon: {
		enabled: true,
		icon: 'icon-diamond',
		size: 8,
		position: 'center',
		priority: 40,
		color: {
			color: 'border',
			colorAdjustments: [{ type: 'MIN_CONTRAST', value: 0.5 }],
		},
	},
	sectorCapitalIcon: {
		enabled: true,
		icon: 'icon-triangle',
		size: 6,
		position: 'center',
		priority: 30,
		color: {
			color: 'border',
			colorAdjustments: [{ type: 'MIN_CONTRAST', value: 0.5 }],
		},
	},
	populatedSystemIcon: {
		enabled: true,
		icon: 'icon-square',
		size: 2,
		position: 'center',
		priority: 20,
		color: {
			color: 'border',
			colorAdjustments: [{ type: 'MIN_CONTRAST', value: 0.5 }],
		},
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
		enabled: false,
		icon: 'icon-wormhole',
		size: 8,
		position: 'right',
		priority: 40,
		color: { color: 'white', colorAdjustments: [] },
	},
	gatewayIcon: {
		enabled: false,
		icon: 'icon-gateway',
		size: 8,
		position: 'right',
		priority: 30,
		color: { color: 'white', colorAdjustments: [] },
	},
	lGateIcon: {
		enabled: false,
		icon: 'icon-l-gate',
		size: 8,
		position: 'right',
		priority: 20,
		color: { color: 'white', colorAdjustments: [] },
	},
	shroudTunnelIcon: {
		enabled: false,
		icon: 'icon-shroud-tunnel',
		size: 8,
		position: 'right',
		priority: 10,
		color: { color: 'white', colorAdjustments: [] },
	},
	unionMode: false,
	unionFederations: 'joinedBorders',
	unionFederationsColor: 'founder',
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
	lGateStroke: {
		enabled: false,
		width: 1,
		smoothing: false,
		glow: false,
		dashed: false,
		dashArray: '3 3',
	},
	lGateStrokeColor: {
		color: 'intense_purple',
		colorAdjustments: [],
	},
	shroudTunnelStroke: {
		enabled: false,
		width: 1,
		smoothing: false,
		glow: false,
		dashed: false,
		dashArray: '3 3',
	},
	shroudTunnelStrokeColor: {
		color: 'intense_purple',
		colorAdjustments: [],
	},
	voronoiGridSize: 30,
	hyperlaneSensitiveBorders: true,
	claimVoidBorderThreshold: 0.6,
	claimVoidMaxSize: 1000,
	starScapeDust: false,
	starScapeDustColor: {
		color: 'ochre_brown',
		colorAdjustments: [{ type: 'OPACITY', value: 0.5 }],
	},
	starScapeNebula: false,
	starScapeNebulaColor: {
		color: 'bright_purple',
		colorAdjustments: [{ type: 'OPACITY', value: 1 }],
	},
	starScapeNebulaAccentColor: {
		color: 'intense_purple',
		colorAdjustments: [{ type: 'OPACITY', value: 1 }],
	},
	starScapeCore: false,
	starScapeCoreColor: {
		color: 'ochre_brown',
		colorAdjustments: [
			{ type: 'OPACITY', value: 1 },
			{ type: 'LIGHTEN', value: 1 },
		],
	},
	starScapeCoreAccentColor: {
		color: 'off_white',
		colorAdjustments: [{ type: 'OPACITY', value: 1 }],
	},
	starScapeStars: false,
	starScapeStarsColor: {
		color: 'desert_yellow',
		colorAdjustments: [
			{ type: 'OPACITY', value: 0.75 },
			{ type: 'LIGHTEN', value: 1 },
		],
	},
	starScapeStarsCount: 5000,
};

export const mapSettings = localStorageStore('mapSettings', defaultMapSettings);
export const editedMapSettings = localStorageStore('editedMapSettings', get(mapSettings));
export const lastProcessedMapSettings = localStorageStore(
	'lastProcessedMapSettings',
	defaultMapSettings,
);
mapSettings.set(validateAndResetSettings(get(mapSettings)));
editedMapSettings.set(validateAndResetSettings(get(editedMapSettings)));
lastProcessedMapSettings.set(validateAndResetSettings(get(lastProcessedMapSettings)));
export const applyMapSettings = () => {
	mapSettings.set(get(editedMapSettings));
	if (
		settingsAreDifferent(get(mapSettings), get(lastProcessedMapSettings), {
			requiresReprocessingOnly: true,
		})
	) {
		lastProcessedMapSettings.set(get(mapSettings));
	}
};

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
		name: 'Tight',
		settings: {
			...defaultMapSettings,
			voronoiGridSize: 10,
			claimVoidBorderThreshold: 0.6,
			claimVoidMaxSize: 200,
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
						type: 'MIN_LIGHTNESS',
						value: 0.5,
					},
					{
						type: 'OPACITY',
						value: 0.15,
					},
				],
			},
			borderFillFade: 0.25,
			backgroundColor: {
				color: 'true_black',
				colorAdjustments: [],
			},
			borderStroke: {
				...defaultMapSettings.borderStroke,
				width: 1,
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
		name: 'Starry Gold',
		settings: {
			...defaultMapSettings,
			countryNames: false,
			borderColor: {
				color: 'primary',
				colorAdjustments: [{ type: 'MIN_LIGHTNESS', value: 0.6 }],
			},
			borderFillColor: {
				color: 'border',
				colorAdjustments: [{ type: 'OPACITY', value: 0 }],
			},
			backgroundColor: {
				color: 'true_black',
				colorAdjustments: [],
			},
			borderFillFade: 0.15,
			starScapeCore: true,
			starScapeDust: true,
			starScapeNebula: true,
			starScapeStars: true,
		},
	},
	{
		name: 'Starry Blue',
		settings: {
			...defaultMapSettings,
			countryNames: false,
			borderColor: {
				color: 'primary',
				colorAdjustments: [{ type: 'MIN_LIGHTNESS', value: 0.6 }],
			},
			borderFillColor: {
				color: 'border',
				colorAdjustments: [{ type: 'OPACITY', value: 0 }],
			},
			backgroundColor: {
				color: 'true_black',
				colorAdjustments: [],
			},
			borderFillFade: 0.15,
			starScapeDust: true,
			starScapeDustColor: {
				color: 'blue',
				colorAdjustments: [{ type: 'OPACITY', value: 0.75 }],
			},
			starScapeNebula: true,
			starScapeNebulaColor: {
				color: 'red_orange',
				colorAdjustments: [{ type: 'OPACITY', value: 1 }],
			},
			starScapeNebulaAccentColor: {
				color: 'intense_red',
				colorAdjustments: [{ type: 'OPACITY', value: 1 }],
			},
			starScapeCore: true,
			starScapeCoreColor: {
				color: 'wave_blue',
				colorAdjustments: [
					{ type: 'OPACITY', value: 1 },
					{ type: 'LIGHTEN', value: 0.2 },
				],
			},
			starScapeCoreAccentColor: {
				color: 'white',
				colorAdjustments: [{ type: 'OPACITY', value: 1 }],
			},
			starScapeStars: true,
			starScapeStarsColor: {
				color: 'mist_blue',
				colorAdjustments: [
					{ type: 'OPACITY', value: 0.75 },
					{ type: 'LIGHTEN', value: 1 },
				],
			},
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
			voronoiGridSize: 25,
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
					case 'icon':
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

export function validateAndResetSettings(unvalidatedSettings: MapSettings): MapSettings {
	const settings = { ...unvalidatedSettings };
	const configs = mapSettingConfig.flatMap((category) => category.settings);
	for (const key of Object.keys(settings)) {
		const config = configs.find((config) => config.id === key);
		if (!config) {
			console.warn(`no config found for setting ${key}; deleting`);
			delete settings[key as keyof MapSettings];
		} else {
			const [valid] = validateSetting(settings[key as keyof MapSettings], config);
			if (!valid) {
				console.warn(`invalid value for setting ${key}; setting default`);
				(settings as any)[key] = (defaultMapSettings as any)[key];
			}
		}
	}
	for (const config of configs) {
		if (!Object.hasOwn(settings, config.id)) {
			console.warn(`missing value for setting ${config.id}; setting default`);
			(settings as any)[config.id] = (defaultMapSettings as any)[config.id];
		}
	}
	return settings;
}

export function validateSetting<T extends MapSettingConfig>(
	value: unknown,
	config: T,
): [boolean] | [boolean, MessageID, Record<string, PrimitiveType>] {
	switch (config.type) {
		case 'color': {
			const result = colorSettingSchema.safeParse(value);
			if (result.success) {
				const { data } = result;
				if (config.allowedAdjustments) {
					return [
						data.colorAdjustments.every(
							(adjustment) =>
								adjustment.type == null || config.allowedAdjustments?.includes(adjustment.type),
						),
					];
				} else {
					return [true];
				}
			} else {
				return [false];
			}
		}
		case 'icon': {
			const result = iconSettingSchema.safeParse(value);
			return [result.success];
		}
		case 'number': {
			if (typeof value === 'number') {
				const min = config.min ?? -Infinity;
				const max = config.max ?? Infinity;
				const message =
					Number.isFinite(min) && Number.isFinite(max)
						? `validation.min_max`
						: Number.isFinite(min)
							? `validation.min`
							: `validation.max`;
				return [value >= min && value <= max, message, { min, max }];
			} else if (value == null) {
				return [Boolean(config.optional), 'validation.required', {}];
			} else {
				return [false];
			}
		}
		case 'range': {
			if (typeof value === 'number') {
				return [value >= config.min && value <= config.max];
			} else {
				return [false];
			}
		}
		case 'select': {
			if (typeof value === 'string') {
				if (config.dynamicOptions) {
					// dynamic options aren't checked for now; assume valid
					return [true];
				} else {
					return [config.options.some((option) => option.id === value)];
				}
			} else {
				return [false];
			}
		}
		case 'stroke': {
			const result = strokeSettingSchema.safeParse(value);
			if (result.success) {
				const { data } = result;
				if (data.dashed && config.noDashed) return [false];
				if (data.smoothing && config.noSmoothing) return [false];
				return [true];
			} else {
				return [false];
			}
		}
		case 'text': {
			return [typeof value === 'string'];
		}
		case 'toggle': {
			return [typeof value === 'boolean'];
		}
		default: {
			console.warn(`unknown setting type ${(config as { type?: unknown }).type}`);
			return [false];
		}
	}
}
