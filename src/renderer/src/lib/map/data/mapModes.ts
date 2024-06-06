import type { MessageID } from '../../../intl';
import type { GameState } from '../../GameState';
import type { MapSettings } from '../../settings';
import { getUnionLeaderId } from './utils';

interface MapMode {
	country: MapModeBorder[];
}

interface MapModeBorder {
	label: MessageID;
	showInLegend: 'always' | 'never' | 'exists';
	primaryColor: string;
	secondaryColor?: string;
	matches: (gameState: GameState, countryId: number, povCountryId?: number) => boolean;
}

export const mapModes: Record<string, MapMode> = {
	wars: {
		country: [
			{
				label: 'map_mode.common.selected_country',
				showInLegend: 'always',
				primaryColor: 'dark_teal',
				matches: (_gameState, countryId, povCountryId) => countryId === povCountryId,
			},
			{
				label: 'map_mode.wars.ally',
				showInLegend: 'always',
				primaryColor: 'sky_blue',
				matches: (gameState, countryId, povCountryId) =>
					Object.values(gameState.war).some(
						(war) =>
							(war.attackers.some((c) => c.country === countryId) &&
								war.attackers.some((c) => c.country === povCountryId)) ||
							(war.defenders.some((c) => c.country === countryId) &&
								war.defenders.some((c) => c.country === povCountryId)),
					),
			},
			{
				label: 'map_mode.wars.hostile',
				showInLegend: 'always',
				primaryColor: 'red',
				matches: areCountriesHostile,
			},
			{
				label: 'map_mode.wars.at_war',
				showInLegend: 'always',
				primaryColor: 'orange',
				matches: (gameState, countryId) =>
					Object.values(gameState.war).some(
						(war) =>
							war.attackers.some((c) => c.country === countryId) ||
							war.defenders.some((c) => c.country === countryId),
					),
			},
			{
				label: 'map_mode.wars.at_peace',
				showInLegend: 'always',
				primaryColor: 'white',
				matches: () => true,
			},
		],
	},
};

interface CountryMapModeInfo {
	primaryColor: string;
	secondaryColor: string;
	mapModeIndex?: number;
	// TODO tooltip
}

export const defaultCountryMapModeInfo: CountryMapModeInfo = {
	primaryColor: 'black',
	secondaryColor: 'black',
};

export function getCountryMapModeInfo(
	countryId: number,
	gameState: GameState,
	settings: Pick<
		MapSettings,
		| 'mapMode'
		| 'mapModePointOfView'
		| 'unionMode'
		| 'unionFederations'
		| 'unionHegemonies'
		| 'unionSubjects'
		| 'unionFederationsColor'
	>,
): CountryMapModeInfo {
	const povCountryId =
		settings.mapModePointOfView === 'player'
			? gameState.player.filter((p) => gameState.country[p.country])[0]?.country
			: parseInt(settings.mapModePointOfView);
	const mapMode = mapModes[settings.mapMode];
	if (mapMode) {
		const match = mapMode.country.find(({ matches }) =>
			matches(gameState, countryId, povCountryId),
		);
		if (match) {
			return {
				primaryColor: match.primaryColor,
				secondaryColor: match.secondaryColor ?? match.primaryColor,
			};
		} else {
			return defaultCountryMapModeInfo;
		}
	} else {
		const colors =
			gameState.country[
				getUnionLeaderId(countryId, gameState, settings, ['joinedBorders', 'separateBorders'])
			]?.flag?.colors;
		// TODO tooltips including country name, federation status, subject status
		return { primaryColor: colors?.[0] ?? 'black', secondaryColor: colors?.[1] ?? 'black' };
	}
}

function areCountriesHostile(
	gameState: GameState,
	id1: number | null | undefined,
	id2: number | null | undefined,
) {
	if (id1 == null || id2 == null) return false;
	const HOSTILE_COUNTRY_TYPES = ['dormant_marauders', 'awakened_marauders', 'ruined_marauders']; // it would be better to parse common/country_types
	const country1 = gameState.country[id1];
	const country2 = gameState.country[id2];
	const relationTo2 = country1?.relations_manager.relation.find((r) => r.country === id2);
	const relationTo1 = country2?.relations_manager.relation.find((r) => r.country === id1);
	if (
		Object.values(gameState.war).some(
			(war) =>
				(war.attackers.some((c) => c.country === id1) &&
					war.defenders.some((c) => c.country === id2)) ||
				(war.defenders.some((c) => c.country === id1) &&
					war.attackers.some((c) => c.country === id2)),
		)
	)
		return true;
	if (country1?.overlord === id2 || country2?.overlord === id1) return false;
	if (relationTo1?.truce != null || relationTo2?.truce != null) return false;
	// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
	if (relationTo1?.hostile || relationTo2?.hostile) return true;
	if (
		country1 &&
		country2 &&
		(HOSTILE_COUNTRY_TYPES.includes(country1.type) || HOSTILE_COUNTRY_TYPES.includes(country2.type))
	)
		return true;
	return false;
}
