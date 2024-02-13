<script lang="ts">
	import { mapSettings } from '../mapSettings';
	import Glow from './Glow.svelte';
	import type { MapData } from './data/processMapData';
	import {
		approximateBorderFadeOpacity,
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
			{...$mapSettings.borderFillFade === 0
				? getFillColorAttributes({
						mapSettings: $mapSettings,
						colors,
						countryColors: border,
						colorStack: [$mapSettings.borderFillColor],
					})
				: { fill: 'none' }}
		/>
		{#if $mapSettings.borderFillFade > 0}
			<path
				id="border-{border.countryId}-inner"
				d={border.innerPath}
				clip-path={`url(#border-${border.countryId}-inner-clip-path)`}
				stroke-width={(1 - $mapSettings.borderFillFade) * 25}
				filter="url(#fade)"
				fill="none"
				{...getStrokeColorAttributes({
					mapSettings: $mapSettings,
					colors,
					countryColors: border,
					colorStack: [$mapSettings.borderFillColor],
				})}
			/>
		{/if}
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
						colorStack: [
							$mapSettings.sectorBorderColor,
							approximateBorderFadeOpacity(
								$mapSettings.borderFillColor,
								$mapSettings.borderFillFade,
							),
						],
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
					colorStack: [
						$mapSettings.borderColor,
						approximateBorderFadeOpacity($mapSettings.borderFillColor, $mapSettings.borderFillFade),
					],
				})}
				{filter}
			/>
		</Glow>
	{/each}
{/if}
