import { mapModes } from '../map/data/mapModes';
import { countryOptions } from './options/countryOptions';
import { fontOptions } from './options/fontOptions';
import { glyphOptions } from './options/glyphOptions';
import { speciesOptions } from './options/speciesOptions';
import { unionOptions } from './options/unionOptions';
import { type MapSettingConfigGroup } from './SettingConfig';
import { isColorDynamic } from './utils';

export const mapSettingsConfig: MapSettingConfigGroup[] = [
	{
		id: 'mapMode',
		name: 'setting.mapMode',
		settings: [
			{
				id: 'mapMode',
				type: 'select',
				options: Object.values(mapModes),
				requiresReprocessing: true,
			},
			{
				id: 'mapModePointOfView',
				type: 'select',
				options: [{ id: 'player', name: 'option.country.player' }],
				dynamicOptions: countryOptions,
				requiresReprocessing: true,
			},
			{
				id: 'mapModeSpecies',
				type: 'select',
				options: [{ id: 'player', name: 'option.country.player' }],
				dynamicOptions: speciesOptions,
				requiresReprocessing: true,
			},
		],
	},
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
				tooltip: 'setting.borderFillFade_tooltip',
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
				id: 'frontierBubbleThreshold',
				type: 'number',
				min: 0,
				step: 1,
				optional: true,
				requiresReprocessing: true,
				tooltip: 'setting.frontierBubbleThreshold_tooltip',
			},
			{
				id: 'sectorTypeBorderStyles',
				type: 'toggle',
				tooltip: 'setting.sectorTypeBorderStyles_tooltip',
				requiresReprocessing: true,
			},
			{
				id: 'sectorCoreBorderStroke',
				type: 'stroke',
				requiresReprocessing: (prev, next) => prev.smoothing !== next.smoothing,
				hideIf: (settings) => !settings.sectorTypeBorderStyles,
			},
			{
				id: 'sectorCoreBorderColor',
				type: 'color',
				hideIf: (settings) =>
					!settings.sectorTypeBorderStyles || !settings.sectorBorderStroke.enabled,
			},
			{
				id: 'sectorFrontierBorderStroke',
				type: 'stroke',
				requiresReprocessing: (prev, next) => prev.smoothing !== next.smoothing,
				hideIf: (settings) => !settings.sectorTypeBorderStyles,
			},
			{
				id: 'sectorFrontierBorderColor',
				type: 'color',
				hideIf: (settings) =>
					!settings.sectorTypeBorderStyles || !settings.sectorBorderStroke.enabled,
			},
			{
				id: 'unionBorderStroke',
				type: 'stroke',
				requiresReprocessing: (prev, next) => prev.smoothing !== next.smoothing,
				hideIf: (settings) =>
					!settings.unionMode ||
					![settings.unionFederations, settings.unionHegemonies, settings.unionSubjects].includes(
						'joinedBorders',
					),
			},
			{
				id: 'unionBorderColor',
				type: 'color',
				hideIf: (settings) =>
					!settings.unionBorderStroke.enabled ||
					!settings.unionMode ||
					![settings.unionFederations, settings.unionHegemonies, settings.unionSubjects].includes(
						'joinedBorders',
					),
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
				id: 'unionHegemonies',
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
				hideIf: (settings) =>
					!settings.unionMode ||
					(settings.unionFederations === 'off' && settings.unionHegemonies === 'off'),
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
		id: 'occupation',
		name: 'setting.group.occupation',
		settings: [
			{
				id: 'occupation',
				type: 'toggle',
				requiresReprocessing: true,
			},
			{
				id: 'occupationColor',
				type: 'color',
				hideIf: (settings) => !settings.occupation,
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
				hideIf: (settings) => !settings.countryNames,
			},
			{
				id: 'countryNamesMinSize',
				requiresReprocessing: true,
				type: 'number',
				min: 0,
				step: 1,
				optional: true,
				hideIf: (settings) => !settings.countryNames,
				tooltip: 'setting.countryNamesMinSize_tooltip',
			},
			{
				id: 'countryNamesMaxSize',
				requiresReprocessing: true,
				type: 'number',
				min: 0,
				step: 1,
				optional: true,
				hideIf: (settings) => !settings.countryNames,
				tooltip: 'setting.countryNamesMaxSize_tooltip',
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
				tooltip: 'setting.countryEmblemsMinSize_tooltip',
			},
			{
				id: 'countryEmblemsMaxSize',
				requiresReprocessing: true,
				type: 'number',
				min: 0,
				step: 1,
				optional: true,
				hideIf: (settings) => !settings.countryEmblems,
				tooltip: 'setting.countryEmblemsMaxSize_tooltip',
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
		id: 'systemLabels',
		name: 'setting.group.systemLabels',
		settings: [
			{
				id: 'systemNames',
				type: 'select',
				options: [
					{ id: 'none', name: 'option.system_names.none' },
					{ id: 'countryCapitals', name: 'option.system_names.country_capitals' },
					{ id: 'sectorCapitals', name: 'option.system_names.sector_capitals' },
					{ id: 'colonized', name: 'option.system_names.colonized' },
					{ id: 'all', name: 'option.system_names.all' },
				],
			},
			{
				id: 'systemNamesFont',
				type: 'select',
				options: [{ id: 'Orbitron', literalName: 'Orbitron' }],
				dynamicOptions: fontOptions,
			},
			{
				id: 'systemNamesFontSize',
				type: 'number',
				min: 0,
				step: 0.5,
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
				options: [{ id: 'player', name: 'option.country.player' }],
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
				id: 'borderGap',
				requiresReprocessing: true,
				type: 'number',
				step: 0.5,
				min: 0,
				optional: true,
				tooltip: 'setting.borderGap_tooltip',
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
	{
		id: 'legend',
		name: 'setting.group.legend',
		settings: [
			{
				id: 'legend',
				type: 'toggle',
			},
			{
				id: 'legendFontSize',
				type: 'number',
				min: 1,
				step: 1,
				requiresReprocessing: true,
			},
			{
				id: 'legendBorderStroke',
				type: 'stroke',
				noSmoothing: true,
			},
			{
				id: 'legendBorderColor',
				type: 'color',
				allowedDynamicColors: [],
				allowedAdjustments: ['DARKEN', 'LIGHTEN', 'MAX_LIGHTNESS', 'MIN_LIGHTNESS', 'OPACITY'],
			},
			{
				id: 'legendBackgroundColor',
				type: 'color',
				allowedDynamicColors: [],
				allowedAdjustments: ['DARKEN', 'LIGHTEN', 'MAX_LIGHTNESS', 'MIN_LIGHTNESS', 'OPACITY'],
			},
		],
	},
	{
		id: 'solarSystemMap',
		name: 'setting.group.solarSystemMap',
		settings: [
			{
				id: 'systemMapOrbitStroke',
				type: 'stroke',
				noSmoothing: true,
			},
			{
				id: 'systemMapOrbitColor',
				type: 'color',
				allowedDynamicColors: [],
				hideIf: (settings) => !settings.systemMapOrbitStroke.enabled,
			},
			{
				id: 'systemMapPlanetScale',
				type: 'number',
				optional: true,
				min: 0,
				step: 0.1,
			},
			{
				id: 'systemMapLabelPlanetsFont',
				type: 'select',
				options: [{ id: 'Orbitron', literalName: 'Orbitron' }],
				dynamicOptions: fontOptions,
			},
			{
				id: 'systemMapLabelPlanetsFontSize',
				type: 'number',
				min: 0,
				step: 1,
			},
			{
				id: 'systemMapLabelPlanetsPosition',
				type: 'select',
				options: [
					{ id: 'top', name: 'option.system_map_label_position.top' },
					{ id: 'bottom', name: 'option.system_map_label_position.bottom' },
					{ id: 'left', name: 'option.system_map_label_position.left' },
					{ id: 'right', name: 'option.system_map_label_position.right' },
					{ id: 'orbit', name: 'option.system_map_label_position.orbit' },
				],
			},
			{
				id: 'systemMapLabelPlanetsFallbackPosition',
				type: 'select',
				hideIf: (settings) => settings.systemMapLabelPlanetsPosition !== 'orbit',
				options: [
					{ id: 'top', name: 'option.system_map_label_position.top' },
					{ id: 'bottom', name: 'option.system_map_label_position.bottom' },
					{ id: 'left', name: 'option.system_map_label_position.left' },
					{ id: 'right', name: 'option.system_map_label_position.right' },
				],
			},
			{
				id: 'systemMapLabelColoniesEnabled',
				type: 'toggle',
			},
			{
				id: 'systemMapLabelStarsEnabled',
				type: 'toggle',
			},
			{
				id: 'systemMapLabelPlanetsEnabled',
				type: 'toggle',
			},
			{
				id: 'systemMapLabelMoonsEnabled',
				type: 'toggle',
			},
			{
				id: 'systemMapLabelAsteroidsEnabled',
				type: 'toggle',
			},
			{
				id: 'systemMapHyperlanesEnabled',
				type: 'toggle',
			},
		],
	},
];
