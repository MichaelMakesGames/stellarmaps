import type { MessageID } from '../../../intl';
import type { Country, GalacticObject, GameState, Species } from '../../GameState';
import type { ColorSetting, MapSettings } from '../../settings';
import { isDefined, parseNumberEntry } from '../../utils';
import { getUnionLeaderId } from './utils';

interface MapMode {
	country?: MapModeBorder[];
	system?: MapModeSystem;
}

interface MapModeBorder {
	label: MessageID | null;
	showInLegend: 'always' | 'never' | 'exists';
	primaryColor: string;
	secondaryColor?: string;
	matches: (gameState: GameState, countryId: number, povCountryId?: number) => boolean;
}

interface MapModeSystem {
	getValues: (
		gameState: GameState,
		system: GalacticObject,
		povCountry: Country | null,
		selectedSpecies: Species | null,
	) => MapModeSystemValue[];
}

interface MapModeSystemValue {
	value: number;
	color: ColorSetting;
	// TODO tooltip
	// TODO legend
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
	population: {
		country: [
			{
				label: 'map_mode.common.selected_country',
				showInLegend: 'never',
				matches: () => true,
				primaryColor: 'black',
			},
		],
		system: {
			getValues: (gameState, system) => {
				const planets = system.colonies
					.map((planetId) => gameState.planets.planet[planetId])
					.filter(isDefined);
				const population = planets.reduce(
					(totalPopulation, planet) => totalPopulation + (planet.num_sapient_pops ?? 0),
					0,
				);
				return [
					{
						value: population,
						color: { color: 'intense_blue', colorAdjustments: [{ type: 'OPACITY', value: 0.5 }] },
					},
				];
			},
		},
	},
	populationByCountry: {
		country: [
			{
				label: null,
				showInLegend: 'never',
				matches: () => true,
				primaryColor: 'black',
			},
		],
		system: {
			getValues: (gameState, system) => {
				const planets = system.colonies
					.map((planetId) => gameState.planets.planet[planetId])
					.filter(isDefined);
				const populationByCountry: Map<number, number> = planets.reduce<Map<number, number>>(
					(acc, planet) => {
						if (planet.owner != null && planet.num_sapient_pops != null) {
							acc.set(planet.owner, (acc.get(planet.owner) ?? 0) + planet.num_sapient_pops);
						}
						return acc;
					},
					new Map(),
				);
				return Array.from(populationByCountry)
					.map<MapModeSystemValue>(([countryId, population]) => {
						const color = gameState.country[countryId]?.flag?.colors[0] ?? 'black';
						return {
							value: population,
							color: {
								color,
								colorAdjustments: [
									{ type: 'MIN_CONTRAST', value: 0.25 },
									{ type: 'OPACITY', value: 0.75 },
								],
							},
						};
					})
					.sort((a, b) => b.value - a.value);
			},
		},
	},
	populationSpecies: {
		country: [
			{
				label: null,
				showInLegend: 'never',
				matches: () => true,
				primaryColor: 'black',
			},
		],
		system: {
			getValues: (gameState, system, _, selectedSpecies) => {
				const planets = system.colonies
					.map((planetId) => gameState.planets.planet[planetId])
					.filter(isDefined);
				const population = planets.reduce(
					(totalPopulation, planet) => totalPopulation + (planet.num_sapient_pops ?? 0),
					0,
				);
				const { freePopulation, enslavedPopulation } = planets.reduce(
					(acc, planet) => {
						let freePlanetPopulation = 0;
						let enslavedPlanetPopulation = 0;
						for (const [speciesId, speciesPopulation] of Object.entries(
							planet.species_information ?? {},
						).map(parseNumberEntry)) {
							if (
								selectedSpecies?.id != null &&
								(speciesId === selectedSpecies.id ||
									gameState.species_db[speciesId]?.base_ref === selectedSpecies.id)
							) {
								freePlanetPopulation +=
									speciesPopulation.num_pops - (speciesPopulation.num_enslaved ?? 0);
								enslavedPlanetPopulation += speciesPopulation.num_enslaved ?? 0;
							}
						}
						acc.freePopulation += freePlanetPopulation;
						acc.enslavedPopulation += enslavedPlanetPopulation;
						return acc;
					},
					{ freePopulation: 0, enslavedPopulation: 0 },
				);
				return [
					{
						value: freePopulation,
						color: { color: 'intense_blue', colorAdjustments: [] },
					},
					{
						value: enslavedPopulation,
						color: { color: 'intense_red', colorAdjustments: [] },
					},
					{
						value: population - freePopulation - enslavedPopulation,
						color: { color: 'dark_grey', colorAdjustments: [] },
					},
				];
			},
		},
	},
	fleetPowerAlliedAndHostile: {
		country: [
			{
				label: null,
				showInLegend: 'never',
				matches: () => true,
				primaryColor: 'black',
			},
		],
		system: {
			getValues(gameState, system, povCountry) {
				const fleetToCountry: Record<string, number> = {};
				Object.values(gameState.country).forEach((country) => {
					country.fleets_manager?.owned_fleets.forEach((owned_fleet) => {
						fleetToCountry[owned_fleet.fleet] = country.id;
					});
				});

				const mainStar =
					system.planet[0] == null ? null : gameState.planets.planet[system.planet[0]];
				const spaceControllerId = mainStar?.controller;

				let ownMobileFleetPower = 0;
				let ownStationFleetPower = 0;
				let alliedMobileFleetPower = 0;
				let alliedStationFleetPower = 0;
				let hostileMobileFleetPower = 0;
				let hostileStationFleetPower = 0;

				const visibleFleets = new Set(povCountry?.sensor_range_fleets);
				// TODO look into incorporating old sightings (country.intel)
				for (const fleetId of system.fleet_presence.filter((id) => visibleFleets.has(id))) {
					const fleet = gameState.fleet[fleetId];
					const controllerId = fleet?.station ? spaceControllerId : fleetToCountry[fleetId];
					const controller = controllerId == null ? null : gameState.country[controllerId];
					if (!fleet || !controller) continue;
					if (povCountry && controller.id === povCountry.id) {
						if (fleet.station) {
							ownStationFleetPower += fleet.military_power;
						} else {
							ownMobileFleetPower += fleet.military_power;
						}
					} else if (areCountriesFightingWarOnSameSide(gameState, povCountry?.id, controllerId)) {
						if (fleet.station) {
							alliedStationFleetPower += fleet.military_power;
						} else {
							alliedMobileFleetPower += fleet.military_power;
						}
					} else if (areCountriesHostile(gameState, povCountry?.id, controllerId)) {
						if (fleet.station) {
							hostileStationFleetPower += fleet.military_power;
						} else {
							hostileMobileFleetPower += fleet.military_power;
						}
					}
				}
				return [
					{
						value: ownMobileFleetPower,
						color: { color: 'dark_teal', colorAdjustments: [{ type: 'LIGHTEN', value: 0.0 }] },
					},
					{
						value: ownStationFleetPower,
						color: { color: 'dark_teal', colorAdjustments: [{ type: 'DARKEN', value: 0.2 }] },
					},
					{
						value: alliedMobileFleetPower,
						color: { color: 'intense_blue', colorAdjustments: [{ type: 'LIGHTEN', value: 0.0 }] },
					},
					{
						value: alliedStationFleetPower,
						color: { color: 'intense_blue', colorAdjustments: [{ type: 'DARKEN', value: 0.2 }] },
					},
					{
						value: hostileMobileFleetPower,
						color: { color: 'intense_red', colorAdjustments: [{ type: 'LIGHTEN', value: 0.0 }] },
					},
					{
						value: hostileStationFleetPower,
						color: { color: 'intense_red', colorAdjustments: [{ type: 'DARKEN', value: 0.2 }] },
					},
				];
			},
		},
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
	if (mapMode?.country) {
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
	const HOSTILE_COUNTRY_TYPES = ['awakened_marauders']; // it would be better to parse common/country_types
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

function areCountriesFightingWarOnSameSide(
	gameState: GameState,
	id1: number | null | undefined,
	id2: number | null | undefined,
) {
	return Object.values(gameState.war).some(
		(war) =>
			(war.attackers.some((c) => c.country === id1) &&
				war.attackers.some((c) => c.country === id2)) ||
			(war.defenders.some((c) => c.country === id1) &&
				war.defenders.some((c) => c.country === id2)),
	);
}