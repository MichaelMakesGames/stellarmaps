import { localStorageStore } from '@skeletonlabs/skeleton';
import { get } from 'svelte/store';

import { type ColorSetting } from './ColorSetting';
import { type IconSetting } from './IconSetting';
import { type StrokeSetting } from './StrokeSetting';
import { settingsAreDifferent, validateAndResetMapSettings } from './utils';

export type NumberMapSettings =
	| 'borderFillFade'
	| 'claimVoidBorderThreshold'
	| 'legendFontSize'
	| 'systemMapLabelPlanetsFontSize'
	| 'systemNamesFontSize'
	| 'terraIncognitaBrightness'
	| 'unionLeaderSymbolSize'
	| 'voronoiGridSize';

export type NumberOptionalMapSettings =
	| 'borderGap'
	| 'countryEmblemsMaxSize'
	| 'countryEmblemsMinSize'
	| 'countryNamesMaxSize'
	| 'countryNamesMinSize'
	| 'countryNamesSecondaryRelativeSize'
	| 'claimVoidMaxSize'
	| 'frontierBubbleThreshold'
	| 'starScapeStarsCount'
	| 'systemMapPlanetScale';

export type StringMapSettings =
	| 'countryNamesFont'
	| 'countryNamesType'
	| 'labelsAvoidHoles'
	| 'mapMode'
	| 'mapModePointOfView'
	| 'mapModeSpecies'
	| 'systemMapLabelPlanetsFont'
	| 'systemMapLabelPlanetsPosition'
	| 'systemMapLabelPlanetsFallbackPosition'
	| 'systemNames'
	| 'systemNamesFont'
	| 'terraIncognitaPerspectiveCountry'
	| 'terraIncognitaStyle'
	| 'unionFederations'
	| 'unionFederationsColor'
	| 'unionHegemonies'
	| 'unionLeaderSymbol'
	| 'unionSubjects';

export type BooleanMapSettings =
	| 'alignStarsToGrid'
	| 'circularGalaxyBorders'
	| 'countryEmblems'
	| 'countryNames'
	| 'hyperlaneMetroStyle'
	| 'hyperlaneSensitiveBorders'
	| 'legend'
	| 'occupation'
	| 'sectorTypeBorderStyles'
	| 'starScapeCore'
	| 'starScapeDust'
	| 'starScapeNebula'
	| 'starScapeStars'
	| 'systemMapLabelColoniesEnabled'
	| 'systemMapLabelStarsEnabled'
	| 'systemMapLabelPlanetsEnabled'
	| 'systemMapLabelMoonsEnabled'
	| 'systemMapLabelAsteroidsEnabled'
	| 'terraIncognita'
	| 'unionLeaderUnderline'
	| 'unionMode';

export type ColorMapSettings =
	| 'backgroundColor'
	| 'borderColor'
	| 'borderFillColor'
	| 'hyperlaneColor'
	| 'hyperRelayColor'
	| 'legendBackgroundColor'
	| 'legendBorderColor'
	| 'lGateStrokeColor'
	| 'occupationColor'
	| 'systemMapOrbitColor'
	| 'sectorBorderColor'
	| 'sectorCoreBorderColor'
	| 'sectorFrontierBorderColor'
	| 'shroudTunnelStrokeColor'
	| 'starScapeCoreAccentColor'
	| 'starScapeCoreColor'
	| 'starScapeDustColor'
	| 'starScapeNebulaAccentColor'
	| 'starScapeNebulaColor'
	| 'starScapeStarsColor'
	| 'unionBorderColor'
	| 'unownedHyperlaneColor'
	| 'unownedHyperRelayColor'
	| 'wormholeStrokeColor';

export type StrokeMapSettings =
	| 'borderStroke'
	| 'hyperlaneStroke'
	| 'hyperRelayStroke'
	| 'legendBorderStroke'
	| 'lGateStroke'
	| 'systemMapOrbitStroke'
	| 'sectorBorderStroke'
	| 'sectorCoreBorderStroke'
	| 'sectorFrontierBorderStroke'
	| 'shroudTunnelStroke'
	| 'unionBorderStroke'
	| 'wormholeStroke';

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

export const defaultMapSettings: MapSettings = {
	mapMode: 'default',
	mapModePointOfView: 'player',
	mapModeSpecies: 'player',
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
	systemNames: 'none',
	systemNamesFont: 'Orbitron',
	systemNamesFontSize: 3,
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
	frontierBubbleThreshold: null,
	sectorTypeBorderStyles: false,
	sectorCoreBorderStroke: {
		enabled: true,
		width: 1,
		smoothing: true,
		glow: false,
		dashed: false,
		dashArray: '3 3',
	},
	sectorCoreBorderColor: {
		color: 'border',
		colorAdjustments: [{ type: 'MIN_CONTRAST', value: 0.25 }],
	},
	sectorFrontierBorderStroke: {
		enabled: true,
		width: 1,
		smoothing: true,
		glow: false,
		dashed: true,
		dashArray: '1 3',
	},
	sectorFrontierBorderColor: {
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
	unionHegemonies: 'joinedBorders',
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
	unionBorderColor: {
		color: 'border',
		colorAdjustments: [{ type: 'MIN_CONTRAST', value: 0.25 }],
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
	borderGap: null,
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
	legend: true,
	legendFontSize: 16,
	legendBorderStroke: {
		width: 1,
		dashed: false,
		smoothing: false,
		glow: false,
		enabled: true,
		dashArray: '3 3',
	},
	legendBorderColor: {
		color: 'grey',
		colorAdjustments: [],
	},
	legendBackgroundColor: {
		color: 'black',
		colorAdjustments: [{ type: 'OPACITY', value: 0.75 }],
	},
	occupation: false,
	occupationColor: {
		color: 'border',
		colorAdjustments: [{ type: 'MIN_CONTRAST', value: 0.25 }],
	},
	systemMapOrbitColor: { color: 'dark_grey', colorAdjustments: [] },
	systemMapOrbitStroke: {
		dashArray: '3 3',
		dashed: false,
		enabled: true,
		glow: false,
		smoothing: false,
		width: 0.5,
	},
	systemMapPlanetScale: 1,
	systemMapLabelPlanetsFont: 'Orbitron',
	systemMapLabelPlanetsFontSize: 10,
	systemMapLabelPlanetsPosition: 'right',
	systemMapLabelPlanetsFallbackPosition: 'bottom',
	systemMapLabelColoniesEnabled: true,
	systemMapLabelStarsEnabled: true,
	systemMapLabelPlanetsEnabled: false,
	systemMapLabelMoonsEnabled: false,
	systemMapLabelAsteroidsEnabled: false,
};

export const mapSettings = localStorageStore('mapSettings', defaultMapSettings);
export const editedMapSettings = localStorageStore('editedMapSettings', get(mapSettings));
export const lastProcessedMapSettings = localStorageStore(
	'lastProcessedMapSettings',
	defaultMapSettings,
);
mapSettings.set(validateAndResetMapSettings(get(mapSettings)));
editedMapSettings.set(validateAndResetMapSettings(get(editedMapSettings)));
lastProcessedMapSettings.set(validateAndResetMapSettings(get(lastProcessedMapSettings)));
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
