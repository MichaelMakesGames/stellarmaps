<script lang="ts">
	import type { MapData } from './data/processMapData';
	import { mapSettings } from '../mapSettings';
	import Glow from './Glow.svelte';
	import {
		getFillColorAttributes,
		getStrokeAttributes,
		getStrokeColorAttributes,
	} from './mapUtils';

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
			{...getFillColorAttributes({
				mapSettings: $mapSettings,
				colors,
				countryColors: border,
				colorStack: [$mapSettings.borderFillColor],
			})}
		/>
		{#each border.sectorBorders.filter(filterSectorBorders) as sectorBorder}
			<Glow
				enabled={sectorBorder.isUnionBorder && $mapSettings.unionBorderStroke.enabled
					? $mapSettings.unionBorderStroke.glow
					: $mapSettings.sectorBorderStroke.glow}
				let:filter
			>
				<path
					d={sectorBorder.path}
					{...getStrokeAttributes(
						sectorBorder.isUnionBorder && $mapSettings.unionBorderStroke.enabled
							? $mapSettings.unionBorderStroke
							: $mapSettings.sectorBorderStroke,
					)}
					{filter}
					clip-path={`url(#border-${border.countryId}-outer-clip-path)`}
					{...getStrokeColorAttributes({
						mapSettings: $mapSettings,
						colors,
						countryColors: border,
						colorStack: [$mapSettings.sectorBorderColor, $mapSettings.borderFillColor],
					})}
					fill="none"
				/>
			</Glow>
		{/each}

		<Glow enabled={$mapSettings.borderStroke.glow} let:filter>
			<path
				id="border-{border.countryId}-border-only"
				d={`${border.borderPath}`}
				{...getFillColorAttributes({
					mapSettings: $mapSettings,
					colors,
					countryColors: border,
					colorStack: [$mapSettings.borderColor, $mapSettings.borderFillColor],
				})}
				{filter}
			/>
		</Glow>
	{/each}
{/if}
