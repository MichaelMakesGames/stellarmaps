<script lang="ts">
	import type { MapData } from '$lib/map/data/processMapData';
	import { mapSettings } from '$lib/mapSettings';
	import {
		symbol,
		symbolCircle,
		symbolCross,
		symbolDiamond,
		symbolSquare,
		symbolStar,
		symbolTriangle,
		symbolWye,
		type SymbolType,
	} from 'd3-shape';
	import { resolveColor } from './mapUtils';

	export let data: MapData;
	export let colors: Record<string, string>;

	const symbols: Record<string, SymbolType> = {
		circle: symbolCircle,
		cross: symbolCross,
		diamond: symbolDiamond,
		square: symbolSquare,
		star: symbolStar,
		triangle: symbolTriangle,
		wye: symbolWye,
	};
	$: countryCapitalIconPath =
		$mapSettings.countryCapitalIcon !== 'none'
			? symbol(symbols[$mapSettings.countryCapitalIcon], $mapSettings.countryCapitalIconSize)()
			: '';
	$: sectorCapitalIconPath =
		$mapSettings.sectorCapitalIcon !== 'none'
			? symbol(symbols[$mapSettings.sectorCapitalIcon], $mapSettings.sectorCapitalIconSize)()
			: '';
	$: populatedSystemIconPath =
		$mapSettings.populatedSystemIcon !== 'none'
			? symbol(symbols[$mapSettings.populatedSystemIcon], $mapSettings.populatedSystemIconSize)()
			: '';
	$: unpopulatedSystemIconPath =
		$mapSettings.unpopulatedSystemIcon !== 'none'
			? symbol(
					symbols[$mapSettings.unpopulatedSystemIcon],
					$mapSettings.unpopulatedSystemIconSize,
			  )()
			: '';
</script>

{#each data.systems as system}
	{#if system.isCountryCapital && $mapSettings.countryCapitalIcon !== 'none' && (!$mapSettings.terraIncognita || (system.systemIsKnown && system.ownerIsKnown))}
		<path
			transform="translate({system.x},{system.y})"
			d={countryCapitalIconPath}
			fill={resolveColor($mapSettings, colors, system, {
				value: $mapSettings.populatedSystemIconColor,
				background: {
					value: $mapSettings.borderFillColor,
				},
			})}
		/>
	{:else if system.isSectorCapital && $mapSettings.sectorCapitalIcon !== 'none' && (!$mapSettings.terraIncognita || (system.systemIsKnown && system.ownerIsKnown))}
		<path
			transform="translate({system.x},{system.y})"
			d={sectorCapitalIconPath}
			fill={resolveColor($mapSettings, colors, system, {
				value: $mapSettings.populatedSystemIconColor,
				background: {
					value: $mapSettings.borderFillColor,
				},
			})}
		/>
	{:else if system.isColonized && $mapSettings.populatedSystemIcon !== 'none' && (!$mapSettings.terraIncognita || (system.systemIsKnown && system.ownerIsKnown))}
		<path
			transform="translate({system.x},{system.y})"
			d={populatedSystemIconPath}
			fill={resolveColor($mapSettings, colors, system, {
				value: $mapSettings.populatedSystemIconColor,
				background: {
					value: $mapSettings.borderFillColor,
				},
			})}
		/>
	{:else if $mapSettings.unpopulatedSystemIcon !== 'none' && (!$mapSettings.terraIncognita || system.systemIsKnown)}
		<path transform="translate({system.x},{system.y})" d={unpopulatedSystemIconPath} fill="white" />
	{/if}
{/each}
