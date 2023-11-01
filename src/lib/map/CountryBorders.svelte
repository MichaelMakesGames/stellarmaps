<script lang="ts">
	import { mapSettings } from '$lib/mapSettings';
	import type { MapData } from '$lib/map/data/processMapData';
	import { resolveColor, getStrokeAttributes } from './mapUtils';

	export let data: MapData;
	export let colors: Record<string, string>;

	function filterSectorBorders(sectorBorder: { path: string; isUnionBorder: boolean }) {
		if (sectorBorder.isUnionBorder) {
			return $mapSettings.sectorBorderStroke.enabled || $mapSettings.unionBorderStroke.enabled;
		} else {
			return $mapSettings.sectorBorderStroke.enabled;
		}
	}
</script>

{#if $mapSettings.borderStroke.enabled}
	{#each data.borders.filter((border) => border.isKnown || !$mapSettings.terraIncognita) as border}
		<path id="border-{border.countryId}-outer" d={`${border.outerPath}`} fill="none" />
		<path
			id="border-{border.countryId}-inner"
			d={border.innerPath}
			fill={resolveColor($mapSettings, colors, border, {
				value: $mapSettings.borderFillColor,
			})}
		/>
		{#each border.sectorBorders.filter(filterSectorBorders) as sectorBorder}
			{#if sectorBorder.isUnionBorder && $mapSettings.unionBorderStroke.enabled ? $mapSettings.unionBorderStroke.glow : $mapSettings.sectorBorderStroke.glow}
				<path
					d={sectorBorder.path}
					{...getStrokeAttributes(
						sectorBorder.isUnionBorder && $mapSettings.unionBorderStroke.enabled
							? $mapSettings.unionBorderStroke
							: $mapSettings.sectorBorderStroke,
						true,
					)}
					clip-path={`url(#border-${border.countryId}-outer-clip-path)`}
					stroke={resolveColor($mapSettings, colors, border, {
						value: $mapSettings.sectorBorderColor,
						background: {
							value: $mapSettings.borderFillColor,
						},
					})}
					fill="none"
				/>
			{/if}
			<path
				d={sectorBorder.path}
				{...getStrokeAttributes(
					sectorBorder.isUnionBorder && $mapSettings.unionBorderStroke.enabled
						? $mapSettings.unionBorderStroke
						: $mapSettings.sectorBorderStroke,
					false,
				)}
				clip-path={`url(#border-${border.countryId}-outer-clip-path)`}
				stroke={resolveColor($mapSettings, colors, border, {
					value: $mapSettings.sectorBorderColor,
					background: {
						value: $mapSettings.borderFillColor,
					},
				})}
				fill="none"
			/>
		{/each}

		{#if $mapSettings.borderStroke.glow}
			<path
				id="border-{border.countryId}-border-only"
				d={`${border.borderPath}`}
				fill={resolveColor($mapSettings, colors, border, { value: $mapSettings.borderColor })}
				filter={getStrokeAttributes($mapSettings.borderStroke, true).filter}
			/>
		{/if}
		<path
			id="border-{border.countryId}-border-only"
			d={`${border.borderPath}`}
			fill={resolveColor($mapSettings, colors, border, { value: $mapSettings.borderColor })}
		/>
	{/each}
{/if}
