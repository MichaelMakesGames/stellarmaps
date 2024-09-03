<script lang="ts">
	import { select } from 'd3-selection';
	import { zoom, zoomIdentity } from 'd3-zoom';
	import { t } from '../../../intl';
	import type { GalacticObject, GameState, Planet } from '../../GameState';
	import { mapSettings, type MapSettings } from '../../settings';
	import { isDefined } from '../../utils';
	import { localizeText } from '../data/locUtils';
	import Glow from '../Glow.svelte';
	import { getStrokeAttributes, getStrokeColorAttributes } from '../mapUtils';

	export let system: GalacticObject;
	export let gameState: GameState;
	export let colors: Record<string, string>;
	export let id: string;
	export let exportMode = false;
	export let previewMode = false;
	export let onSystemSelected: null | ((system: GalacticObject) => void) = null;

	let svg: SVGElement;
	let g: SVGGElement;
	let zoomHandler = zoom()
		.on('zoom', (e) => {
			if (g) g.setAttribute('transform', e.transform.toString());
		})
		.filter(function filter(event: MouseEvent) {
			// click and drag for middle button only
			if (event.type === 'mousedown') return event.button === 1;
			// this is the default implementation
			return (!event.ctrlKey || event.type === 'wheel') && !event.button;
		});
	$: if (svg && !exportMode && !previewMode) {
		select(svg).call(zoomHandler as any);
	}
	function resetZoom() {
		if (svg) {
			select(svg).call(zoomHandler.transform as any, zoomIdentity);
		}
	}

	$: planets = system.planet
		.map((planetId) => gameState.planets.planet[planetId])
		.filter(isDefined);

	$: systemConnections = system.hyperlane
		.map((h) => {
			const toSystem = gameState.galactic_object[h.to];
			if (!toSystem) return null;
			const theta = Math.atan2(
				toSystem.coordinate.y - system.coordinate.y,
				// note: inverted x value
				system.coordinate.x - toSystem.coordinate.x,
			);
			const x = 400 * Math.cos(theta);
			const y = 400 * Math.sin(theta);
			const trianglePath = `
				M ${x + Math.cos(theta + Math.PI / 2) * 30} ${y + Math.sin(theta + Math.PI / 2) * 30}
				L ${x - Math.cos(theta + Math.PI / 2) * 30} ${y - Math.sin(theta + Math.PI / 2) * 30}
				L ${x + Math.cos(theta) * 20} ${y + Math.sin(theta) * 20}
				Z
			`;
			const textPathPoints: [[number, number], [number, number]] = [
				[
					x - Math.cos(theta) * 5 + Math.cos(theta + Math.PI / 2) * 500,
					y - Math.sin(theta) * 5 + Math.sin(theta + Math.PI / 2) * 500,
				],
				[
					x - Math.cos(theta) * 5 - Math.cos(theta + Math.PI / 2) * 500,
					y - Math.sin(theta) * 5 - Math.sin(theta + Math.PI / 2) * 500,
				],
			];
			if (y < 0) textPathPoints.reverse();
			const textPath = `M ${textPathPoints[0][0]} ${textPathPoints[0][1]} L ${textPathPoints[1][0]} ${textPathPoints[1][1]}`;
			return { x, y, system: toSystem, trianglePath, textPath };
		})
		.filter(isDefined);

	function getPlanetColor(planet: Planet): string | undefined {
		let pc = planet.planet_class;
		if (pc.includes('_station')) [(pc = pc.substring(0, pc.indexOf('_station')))];
		switch (pc) {
			// standard habitable
			case 'pc_desert':
			case 'pc_arid':
			case 'pc_savanna':
			case 'mem_pc_death': // mem
				return colors.swamp_green;
			case 'pc_tropical':
			case 'pc_continental':
			case 'pc_ocean':
				return colors.intense_blue;
			case 'pc_tundra':
			case 'pc_arctic':
			case 'pc_alpine':
				return colors.ice_turquoise;
			// standard uninhabitable
			case 'pc_gas_giant':
				return colors.beige;
			case 'pc_asteroid':
				return colors.brown;
			case 'pc_ice_asteroid':
				return colors.faded_blue;
			case 'pc_rare_crystal_asteroid':
			case 'pc_crystal_asteroid':
				return colors.wave_blue;
			case 'pc_molten':
				return colors.intense_orange;
			case 'pc_barren':
			case 'pc_hollow': // RS (habitable)
			case 'pc_sterile': // RS (habitable)
			case 'pc_tidally_locked': // RS (habitable)
				return colors.khaki_brown;
			case 'pc_barren_cold':
				return colors.faded_blue;
			case 'pc_toxic':
				return colors.toxic_green;
			case 'pc_frozen':
				return colors.off_white;
			// special
			case 'pc_nuked':
			case 'pc_gpm_precursor_tomb': // gpm
				return colors.grey;
			case 'pc_gaia':
				return colors.ocean_turquoise;
			case 'pc_hive':
			case 'pc_infested':
				return colors.sick_green;
			case 'pc_shielded':
				return colors.blue;
			case 'pc_astral_scar':
			case 'pc_shrouded':
				return colors.intense_purple;
			case 'pc_broken':
			case 'pc_egg_cracked':
			case 'pc_shattered':
			case 'pc_shattered_2':
			case 'pc_mem_destroyed_barren': // mem
			case 'pc_mem_broken_city': // mem
				return colors.brown;
			// artificial
			case 'pc_ai':
			case 'pc_city':
			case 'pc_cosmogenesis_world':
			case 'pc_crystal_habitat':
			case 'pc_cybrex':
			case 'pc_gray_goo':
			case 'pc_habitat_shielded':
			case 'pc_habitat':
			case 'pc_machine_broken':
			case 'pc_machine':
			case 'pc_nanotech':
			case 'pc_ringworld_habitable_damaged':
			case 'pc_ringworld_habitable':
			case 'pc_ringworld_seam_damaged':
			case 'pc_ringworld_seam':
			case 'pc_ringworld_shielded':
			case 'pc_ringworld_tech_damaged':
			case 'pc_ringworld_tech':
			case 'pc_shattered_ring_habitable':
			case 'pc_warden_guardian':
				return colors.ship_steel;
			case 'pc_relic':
				return colors.beige;
			// stars (many of these are from RS)
			case 'pc_o_star':
			case 'pc_o_super_star':
			case 'pc_o_hyper_star':
			case 'pc_giga_o_star': // giga
				return colors.cloud_purple;
			case 'pc_b_star':
			case 'pc_b_super_star':
				return colors.light_blue;
			case 'pc_a_star':
			case 'pc_a_super_star':
				return colors.white;
			case 'pc_f_star':
			case 'pc_f_super_star':
				return colors.desert_yellow;
			case 'pc_g_star':
			case 'pc_g_giant_star':
			case 'pc_g_super_star':
				return colors.bright_yellow;
			case 'pc_k_star':
			case 'pc_k_giant_star':
			case 'pc_k_super_star':
			case 'pc_s_giant_star': // RS zirconium star
			case 'pc_fu_star': // RS FU Orionis
				return colors.light_orange;
			case 'pc_m_star':
			case 'pc_m_giant_star':
			case 'pc_m_super_star':
			case 'pc_m_hyper_star':
			case 'pc_c_giant_star': // RS carbon star
			case 'pc_gigaignited_star': // gaga
				return colors.cerise_red;
			case 'pc_l_star': // RS brown dwarf
			case 'pc_t_star': // brown dwarf
			case 'pc_t_star_big': // giga brown dwarf
			case 'pc_y_star': // RS brown dwarf
				return colors.brown;
			case 'pc_black_hole':
			case 'pc_mem_micro_black_hole': // mem
			case 'pc_black_hole_giga': // giga
			case 'pc_pouchkinn_black_hole': // giga
			case 'pc_ehod_black_hole': // giga
				return colors.true_black;
			case 'pc_neutron_star':
			case 'pc_pulsar':
			case 'pc_d_star': // RS
			case 'pc_collapsar': // RS
			case 'pc_protostar': // RS
			case 'pc_magnetar': // RS
			case 'pc_microquasar_1': // RS
			case 'pc_microquasar_2': // RS
			case 'pc_ae_star': // RS
			case 'pc_mem_synthetic_sun': // mem
			case 'pc_whc_star': // giga
			case 'pc_wh_star': // giga
			case 'pc_whdyson_star': // giga
				return colors.white;
			case 'pc_w_azure_star': // RS
			case 'pc_lbv_blue_star': // RS
				return colors.light_blue;
			case 'pc_w_red_star': // RS
			case 'pc_lbv_red_star': // RS
			case 'pc_tt_red_star': // RS
				return colors.cerise_red;
			case 'pc_tt_orange_star': // RS
				return colors.light_orange;
			case 'pc_w_green_star': // RS
			case 'pc_lbv_green_star': // RS
				return colors.sun_green;
			case 'pc_w_purple_star': // RS
				return colors.cloud_purple;
			case 'pc_tt_white_star': // RS
				return colors.white;
			case 'pc_toxoid_star':
				return colors.sun_green;
			case 'pc_rift_star':
				return colors.intense_purple;
			// RS stations that don't correspond planet classes
			case 'pc_cracking':
				return colors.brown;
			case 'pc_methane':
			case 'pc_greenhouse':
			case 'pc_sulfur':
				return colors.toxic_green;
			case 'pc_scorched':
			case 'pc_hot_giant':
				return colors.intense_orange;
			case 'pc_ice_giant':
				return colors.ice_turquoise;
			// fallback
			default:
				console.warn(`Unhandled planet class: ${pc}; assuming megastructure`);
				return colors.ship_steel;
		}
	}

	function getBeltColor(beltType: string) {
		switch (beltType) {
			case 'icy_asteroid_belt':
				return colors.ice_turquoise;
			case 'crystal_asteroid_belt':
				return colors.wave_blue;
			case 'debris_asteroid_belt':
				return colors.ship_steel;
			default:
				return colors.brown;
		}
	}

	function isAsteroid(planet: Planet) {
		return planet.planet_class.includes('asteroid');
	}

	function isStar(planet: Planet) {
		return (
			isBlackHole(planet) ||
			planet.planet_class.includes('star') ||
			planet.planet_class === 'pc_pulsar' ||
			planet.planet_class === 'pc_collapsar' ||
			planet.planet_class === 'pc_nova_1' ||
			planet.planet_class === 'nova_2'
		);
	}

	function isBlackHole(planet: Planet) {
		return planet.planet_class.includes('black_hole');
	}

	function isColony(planet: Planet) {
		return planet.owner != null;
	}

	function isMoon(planet: Planet) {
		return Boolean(planet.is_moon);
	}

	function getPlanetRadius(planet: Planet, settings: MapSettings) {
		return Math.sqrt(
			planet.planet_size *
				(settings.systemMapPlanetScale ?? 1) *
				(isStar(planet) ? 2 : 1) *
				(isMoon(planet) ? 0.5 : 1),
		);
	}

	function isPlanetLabeled(planet: Planet, settings: MapSettings) {
		return (
			(isColony(planet) && settings.systemMapLabelColoniesEnabled) ||
			(isStar(planet) && settings.systemMapLabelStarsEnabled) ||
			(isMoon(planet) && settings.systemMapLabelMoonsEnabled) ||
			(isAsteroid(planet) && settings.systemMapLabelAsteroidsEnabled) ||
			(!isStar(planet) &&
				!isMoon(planet) &&
				!isAsteroid(planet) &&
				settings.systemMapLabelPlanetsEnabled)
		);
	}

	function getPlanetLabelPathAttributes(planet: Planet, settings: MapSettings) {
		const r = getPlanetRadius(planet, settings);
		let x = -planet.coordinate.x;
		let y = planet.coordinate.y;
		let position = settings.systemMapLabelPlanetsPosition;
		if (position === 'orbit' && !planet.orbit) {
			position = settings.systemMapLabelPlanetsFallbackPosition;
		}
		switch (position) {
			case 'top': {
				y -= r + settings.systemMapLabelPlanetsFontSize / 2;
				x -= 500;
				return { d: `M ${x} ${y} h 1000`, pathLength: 1 };
			}
			case 'bottom': {
				y += r + settings.systemMapLabelPlanetsFontSize / 2;
				x -= 500;
				return { d: `M ${x} ${y} h 1000`, pathLength: 1 };
			}
			case 'right': {
				x += r + settings.systemMapLabelPlanetsFontSize / 2;
				return { d: `M ${x} ${y} h 1000`, pathLength: 1 };
			}
			case 'left': {
				x -= r + settings.systemMapLabelPlanetsFontSize / 2 + 1000;
				return { d: `M ${x} ${y} h 1000`, pathLength: 1 };
			}
			case 'orbit': {
				const cx = -(planets.find((p) => p.id === planet.moon_of)?.coordinate.x ?? 0);
				const cy = planets.find((p) => p.id === planet.moon_of)?.coordinate.y ?? 0;
				const orbitRadius = planet.orbit;
				if (cy > y) {
					return {
						d: `M ${x} ${y} A ${orbitRadius} ${orbitRadius} 0 0 1 ${cx + (cx - x)} ${cy + (cy - y)}`,
					};
				} else {
					return {
						d: `M ${x} ${y} A ${orbitRadius} ${orbitRadius} 0 0 0 ${cx + (cx - x)} ${cy + (cy - y)}`,
					};
				}
			}
			default: {
				throw new Error(`Unhandled label position: ${position}`);
			}
		}
	}

	function getPlanetLabelTextPathAttributes(planet: Planet, settings: MapSettings) {
		const r = getPlanetRadius(planet, settings);
		let position = settings.systemMapLabelPlanetsPosition;
		if (position === 'orbit' && !planet.orbit) {
			position = settings.systemMapLabelPlanetsFallbackPosition;
		}
		switch (position) {
			case 'top': {
				return {
					startOffset: 0.5,
					'dominant-baseline': 'auto',
					'text-anchor': 'middle',
				};
			}
			case 'bottom': {
				return {
					startOffset: 0.5,
					'dominant-baseline': 'hanging',
					'text-anchor': 'middle',
				};
			}
			case 'right': {
				return {
					startOffset: 0,
					'dominant-baseline': 'middle',
					'text-anchor': 'start',
				};
			}
			case 'left': {
				return {
					startOffset: 1,
					'dominant-baseline': 'middle',
					'text-anchor': 'end',
				};
			}
			case 'orbit': {
				return {
					startOffset: r + settings.systemMapLabelPlanetsFontSize / 2,
					'dominant-baseline': 'auto',
					'text-anchor': 'start',
				};
			}
			default: {
				throw new Error(`Unhandled label position: ${position}`);
			}
		}
	}

	function getShadowPath(planet: Planet, settings: MapSettings) {
		const r = getPlanetRadius(planet, settings);
		return `
			M 0 ${r}
			A ${r} ${r} 0 0 0 0 ${-r}
			A ${r * 0.5} ${r} 0 0 1 0 ${r}
			Z
		`;
	}

	function getShadowRotation(planet: Planet) {
		const angle = (Math.atan(planet.coordinate.y / -planet.coordinate.x) / Math.PI / 2) * 360;
		if (planet.coordinate.x > 0) return angle + 180;
		return angle;
	}
</script>

<svg
	{id}
	xmlns="http://www.w3.org/2000/svg"
	xmlns:xlink="http://www.w3.org/1999/xlink"
	viewBox="-500 -500 1000 1000"
	class={!previewMode && !exportMode ? 'h-full w-full' : undefined}
	bind:this={svg}
	x={previewMode ? -500 : undefined}
	y={previewMode ? -500 : undefined}
	width={previewMode ? 1000 : undefined}
>
	<defs>
		<filter id="glow" filterUnits="objectBoundingBox" x="-50%" y="-50%" width="200%" height="200%">
			<feGaussianBlur in="SourceGraphic" stdDeviation="2" />
		</filter>
		<filter
			id="starGlow"
			filterUnits="objectBoundingBox"
			x="-500%"
			y="-500%"
			width="1100%"
			height="1100%"
		>
			<feGaussianBlur in="SourceGraphic" stdDeviation="10" />
		</filter>
	</defs>
	<g bind:this={g}>
		{#if $mapSettings.systemMapOrbitStroke.enabled}
			{#each planets.filter((p) => !isAsteroid(p) && p.orbit > 0) as planet (planet.id)}
				<Glow enabled={$mapSettings.systemMapOrbitStroke.glow}>
					<circle
						cx={-(planets.find((p) => p.id === planet.moon_of)?.coordinate.x ?? 0)}
						cy={planets.find((p) => p.id === planet.moon_of)?.coordinate.y ?? 0}
						r={planet.orbit}
						fill="none"
						{...getStrokeAttributes($mapSettings.systemMapOrbitStroke)}
						{...getStrokeColorAttributes({
							colors,
							mapSettings: $mapSettings,
							colorStack: [$mapSettings.systemMapOrbitColor],
						})}
					/>
				</Glow>
			{/each}
		{/if}

		{#each system.asteroid_belts as belt}
			<circle
				fill="none"
				stroke={getBeltColor(belt.type)}
				stroke-width="2"
				stroke-opacity={0.2}
				r={belt.inner_radius}
			/>
			<circle
				fill="none"
				stroke={getBeltColor(belt.type)}
				stroke-width="4"
				stroke-opacity={0.05}
				r={belt.inner_radius + 5}
			/>
			<circle
				fill="none"
				stroke={getBeltColor(belt.type)}
				stroke-width="4"
				stroke-opacity={0.05}
				r={belt.inner_radius - 5}
			/>
			<circle
				fill="none"
				stroke={getBeltColor(belt.type)}
				stroke-width="1"
				stroke-opacity={0.1}
				r={belt.inner_radius + 10}
			/>
			<circle
				fill="none"
				stroke={getBeltColor(belt.type)}
				stroke-width="1"
				stroke-opacity={0.1}
				r={belt.inner_radius - 10}
			/>
		{/each}
		{#each planets as planet (planet.id)}
			{#if isStar(planet)}
				<Glow enabled filterId="starGlow" let:filter>
					<circle
						fill={isBlackHole(planet) && filter ? '#FFFFFF' : getPlanetColor(planet)}
						r={getPlanetRadius(planet, $mapSettings)}
						cx={-planet.coordinate.x}
						cy={planet.coordinate.y}
						{filter}
					/>
				</Glow>
			{:else}
				<circle
					fill={getPlanetColor(planet)}
					r={getPlanetRadius(planet, $mapSettings)}
					cx={-planet.coordinate.x}
					cy={planet.coordinate.y}
				/>
				<path
					d={getShadowPath(planet, $mapSettings)}
					transform=" translate({-planet.coordinate.x} {planet.coordinate
						.y}) rotate({getShadowRotation(planet)})"
					fill="#000000"
					opacity={0.5}
				/>
			{/if}
		{/each}
		{#each planets.filter((p) => isPlanetLabeled(p, $mapSettings)) as planet (planet.id)}
			<defs>
				<path
					id="planetLabelPath{planet.id}"
					{...getPlanetLabelPathAttributes(planet, $mapSettings)}
				/>
			</defs>
			<text
				font-family={$mapSettings.systemMapLabelPlanetsFont}
				font-size={$mapSettings.systemMapLabelPlanetsFontSize}
				fill="#FFFFFF"
			>
				<textPath
					href="#planetLabelPath{planet.id}"
					{...getPlanetLabelTextPathAttributes(planet, $mapSettings)}
				>
					{#await localizeText(planet.name)}
						{$t('generic.loading')}
					{:then planetName}
						{planetName}
					{/await}
				</textPath>
			</text>
		{/each}
		{#if $mapSettings.systemMapHyperlanesEnabled}
			{#each systemConnections as connection}
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<g
					style={!previewMode && !exportMode ? 'cursor: pointer;' : undefined}
					fill={colors.dark_teal}
					on:click={() => {
						if (previewMode || exportMode) return;
						resetZoom();
						onSystemSelected?.(connection.system);
					}}
				>
					<path d={connection.trianglePath} />
					<defs>
						<path
							id="connectionLabelPath{connection.system.id}"
							pathLength="1"
							d={connection.textPath}
						/>
					</defs>
					<text
						font-family={$mapSettings.systemMapLabelPlanetsFont}
						font-size={$mapSettings.systemMapLabelPlanetsFontSize}
					>
						<textPath
							href="#connectionLabelPath{connection.system.id}"
							startOffset="0.5"
							text-anchor="middle"
							dominant-baseline={connection.y < 0 ? 'hanging' : 'auto'}
						>
							{#await localizeText(connection.system.name)}
								{$t('generic.loading')}
							{:then systemName}
								{systemName}
							{/await}
						</textPath>
					</text>
				</g>
			{/each}
		{/if}
	</g>
</svg>
