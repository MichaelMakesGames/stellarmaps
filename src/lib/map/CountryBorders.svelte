<script lang="ts">
	import { mapSettings } from '$lib/mapSettings';
	import type { MapData } from '$lib/map/data/processMapData';
	import { resolveColor } from './mapUtils';

	export let data: MapData;
	export let colors: Record<string, string>;
</script>

{#each data.borders.filter((border) => border.isKnown || !$mapSettings.terraIncognita) as border}
	<path
		id="border-{border.countryId}-outer"
		d={`${border.outerPath}`}
		fill={resolveColor($mapSettings, colors, border, { value: $mapSettings.borderColor })}
	/>
	<path
		id="border-{border.countryId}-inner"
		d={border.innerPath}
		fill={resolveColor($mapSettings, colors, border, {
			value: $mapSettings.borderFillColor,
			opacity: $mapSettings.borderFillOpacity,
		})}
	/>
	{#if $mapSettings.sectorBorders}
		{#each border.sectorBorders as sectorBorder}
			<path
				d={sectorBorder.path}
				stroke-width={sectorBorder.isUnionBorder
					? $mapSettings.unionBorderWidth
					: $mapSettings.sectorBorderWidth}
				clip-path={resolveColor($mapSettings, colors, border, {
					value: $mapSettings.borderFillColor,
				}) === resolveColor($mapSettings, colors, border, { value: $mapSettings.borderColor })
					? `url(#border-${border.countryId}-outer-clip-path)`
					: `url(#border-${border.countryId}-inner-clip-path)`}
				stroke={resolveColor($mapSettings, colors, border, {
					value: $mapSettings.sectorBorderColor,
					minimumContrast: $mapSettings.sectorBorderMinContrast,
					background: {
						value: $mapSettings.borderFillColor,
						opacity: $mapSettings.borderFillOpacity,
					},
				})}
				stroke-linecap={sectorBorder.isUnionBorder || !$mapSettings.sectorBorderDashArray
					? 'round'
					: null}
				stroke-linejoin={sectorBorder.isUnionBorder || !$mapSettings.sectorBorderDashArray
					? 'round'
					: null}
				fill="none"
				stroke-dasharray={sectorBorder.isUnionBorder ? '' : $mapSettings.sectorBorderDashArray}
			/>
		{/each}
	{/if}
{/each}
