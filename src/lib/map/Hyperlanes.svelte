<script lang="ts">
	import { mapSettings } from '$lib/mapSettings';
	import type { MapData } from '$lib/map/data/processMapData';
	import { resolveColor } from './mapUtils';

	export let data: MapData;
	export let colors: Record<string, string>;
</script>

<path
	d={[
		data.unownedHyperlanesPath,
		...data.borders
			.filter((border) => !border.isKnown && $mapSettings.terraIncognita)
			.map((border) => border.hyperlanesPath),
	].join(' ')}
	stroke={resolveColor(
		$mapSettings,
		colors,
		{ primaryColor: 'white', secondaryColor: 'white' },
		{
			value: ['primary', 'secondary'].includes($mapSettings.hyperlaneColor)
				? $mapSettings.unownedHyperlaneColor
				: $mapSettings.hyperlaneColor,
		},
	)}
	stroke-opacity={['primary', 'secondary'].includes($mapSettings.hyperlaneColor)
		? $mapSettings.unownedHyperlaneOpacity
		: $mapSettings.hyperlaneOpacity}
	stroke-linecap="round"
	stroke-linejoin="round"
	stroke-width={$mapSettings.hyperlaneWidth}
	fill="none"
/>
<path
	d={[
		data.unownedRelayHyperlanesPath,
		...data.borders
			.filter((border) => !border.isKnown && $mapSettings.terraIncognita)
			.map((border) => border.relayHyperlanesPath),
	].join(' ')}
	stroke={resolveColor(
		$mapSettings,
		colors,
		{ primaryColor: 'white', secondaryColor: 'white' },
		{
			value: ['primary', 'secondary'].includes($mapSettings.hyperRelayColor)
				? $mapSettings.unownedHyperRelayColor
				: $mapSettings.hyperRelayColor,
		},
	)}
	stroke-opacity={['primary', 'secondary'].includes($mapSettings.hyperRelayColor)
		? $mapSettings.unownedHyperRelayOpacity
		: $mapSettings.hyperRelayOpacity}
	stroke-linecap="round"
	stroke-linejoin="round"
	stroke-width={$mapSettings.hyperRelayWidth}
	fill="none"
/>
{#each data.borders.filter((border) => border.isKnown || !$mapSettings.terraIncognita) as border}
	<path
		d={border.hyperlanesPath}
		stroke={resolveColor($mapSettings, colors, border, {
			value: $mapSettings.hyperlaneColor,
		})}
		stroke-opacity={$mapSettings.hyperlaneOpacity}
		stroke-linecap="round"
		stroke-linejoin="round"
		stroke-width={$mapSettings.hyperlaneWidth}
		fill="none"
	/>
	<path
		d={border.relayHyperlanesPath}
		stroke={resolveColor($mapSettings, colors, border, {
			value: $mapSettings.hyperRelayColor,
		})}
		stroke-opacity={$mapSettings.hyperRelayOpacity}
		stroke-linecap="round"
		stroke-linejoin="round"
		stroke-width={$mapSettings.hyperRelayWidth}
		fill="none"
	/>
{/each}
