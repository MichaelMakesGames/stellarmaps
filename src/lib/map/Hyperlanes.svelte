<script lang="ts">
	import type { MapData } from '$lib/map/data/processMapData';
	import { isColorDynamic, mapSettings } from '$lib/mapSettings';
	import Glow from './Glow.svelte';
	import { getStrokeAttributes, getStrokeColorAttributes } from './mapUtils';

	export let data: MapData;
	export let colors: Record<string, string>;

	$: hyperRelaysDisabled = !$mapSettings.hyperRelayStroke.enabled;
	$: hyperRelayIsDynamic = isColorDynamic($mapSettings.hyperRelayColor.color, $mapSettings);
	$: unownedHyperRelayColor = hyperRelayIsDynamic
		? $mapSettings.unownedHyperRelayColor
		: $mapSettings.hyperRelayColor;
	$: unownedHyperRelayPath = [
		data.unownedRelayHyperlanesPath,
		...data.borders
			.filter((border) =>
				hyperRelayIsDynamic ? !border.isKnown && $mapSettings.terraIncognita : true,
			)
			.map((border) => border.relayHyperlanesPath),
	].join(' ');

	$: hyperlanesDisabled = !$mapSettings.hyperlaneStroke.enabled;
	$: hyperlaneIsDynamic = isColorDynamic($mapSettings.hyperlaneColor.color, $mapSettings);
	$: unownedHyperlaneColor = hyperlaneIsDynamic
		? $mapSettings.unownedHyperlaneColor
		: $mapSettings.hyperlaneColor;
	$: unownedHyperlanePath =
		[
			data.unownedHyperlanesPath,
			...data.borders
				.filter((border) =>
					hyperlaneIsDynamic ? !border.isKnown && $mapSettings.terraIncognita : true,
				)
				.map((border) => border.hyperlanesPath),
		].join(' ') + (hyperRelaysDisabled ? ` ${unownedHyperRelayPath}` : '');
</script>

{#if !hyperlanesDisabled}
	<Glow enabled={$mapSettings.hyperlaneStroke.glow} let:filter>
		<path
			d={unownedHyperlanePath}
			{...getStrokeColorAttributes({
				mapSettings: $mapSettings,
				colors,
				colorStack: [unownedHyperlaneColor],
			})}
			{...getStrokeAttributes($mapSettings.hyperlaneStroke)}
			{filter}
			fill="none"
		/>
	</Glow>
{/if}
{#if !hyperRelaysDisabled}
	<Glow enabled={$mapSettings.hyperRelayStroke.glow} let:filter>
		<path
			d={unownedHyperRelayPath}
			{...getStrokeColorAttributes({
				mapSettings: $mapSettings,
				colors,
				colorStack: [unownedHyperRelayColor],
			})}
			{...getStrokeAttributes($mapSettings.hyperRelayStroke)}
			{filter}
			fill="none"
		/>
	</Glow>
{/if}

{#each data.borders.filter((border) => border.isKnown || !$mapSettings.terraIncognita) as border}
	{#if !hyperlanesDisabled && hyperlaneIsDynamic}
		<Glow enabled={$mapSettings.hyperlaneStroke.glow} let:filter>
			<path
				d={hyperRelaysDisabled
					? `${border.hyperlanesPath} ${border.relayHyperlanesPath}`
					: border.hyperlanesPath}
				{...getStrokeColorAttributes({
					mapSettings: $mapSettings,
					colors,
					countryColors: border,
					colorStack: [$mapSettings.hyperlaneColor, $mapSettings.borderFillColor],
				})}
				{...getStrokeAttributes($mapSettings.hyperlaneStroke)}
				{filter}
				fill="none"
			/>
		</Glow>
	{/if}
	{#if !hyperRelaysDisabled && hyperRelayIsDynamic}
		<Glow enabled={$mapSettings.hyperRelayStroke.glow} let:filter>
			<path
				d={border.relayHyperlanesPath}
				{...getStrokeColorAttributes({
					mapSettings: $mapSettings,
					colors,
					countryColors: border,
					colorStack: [$mapSettings.hyperRelayColor, $mapSettings.borderFillColor],
				})}
				{...getStrokeAttributes($mapSettings.hyperRelayStroke)}
				{filter}
				fill="none"
			/>
		</Glow>
	{/if}
{/each}
