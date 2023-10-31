<script lang="ts">
	import { mapSettings, type ColorSetting } from '$lib/mapSettings';
	import type { MapData } from '$lib/map/data/processMapData';
	import { resolveColor } from './mapUtils';

	export let data: MapData;
	export let colors: Record<string, string>;

	function getOpacity(color: ColorSetting) {
		return color.colorAdjustments.find((a) => a.type === 'Opacity')?.value ?? 1;
	}

	function filterOpacity(color: ColorSetting) {
		return {
			...color,
			colorAdjustments: color.colorAdjustments.filter((a) => a.type !== 'Opacity'),
		};
	}
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
			value: ['primary', 'secondary', 'border'].includes($mapSettings.hyperlaneColor.color)
				? filterOpacity($mapSettings.unownedHyperlaneColor)
				: filterOpacity($mapSettings.hyperlaneColor),
		},
	)}
	stroke-opacity={['primary', 'secondary', 'border'].includes($mapSettings.hyperlaneColor.color)
		? getOpacity($mapSettings.unownedHyperlaneColor)
		: getOpacity($mapSettings.hyperlaneColor)}
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
			value: ['primary', 'secondary', 'border'].includes($mapSettings.hyperRelayColor.color)
				? filterOpacity($mapSettings.unownedHyperRelayColor)
				: filterOpacity($mapSettings.hyperRelayColor),
		},
	)}
	stroke-opacity={['primary', 'secondary', 'border'].includes($mapSettings.hyperRelayColor.color)
		? getOpacity($mapSettings.unownedHyperRelayColor)
		: getOpacity($mapSettings.hyperRelayColor)}
	stroke-linecap="round"
	stroke-linejoin="round"
	stroke-width={$mapSettings.hyperRelayWidth}
	fill="none"
/>
{#each data.borders.filter((border) => border.isKnown || !$mapSettings.terraIncognita) as border}
	<path
		d={border.hyperlanesPath}
		stroke={resolveColor($mapSettings, colors, border, {
			value: filterOpacity($mapSettings.hyperlaneColor),
		})}
		stroke-opacity={getOpacity($mapSettings.hyperlaneColor)}
		stroke-linecap="round"
		stroke-linejoin="round"
		stroke-width={$mapSettings.hyperlaneWidth}
		fill="none"
	/>
	<path
		d={border.relayHyperlanesPath}
		stroke={resolveColor($mapSettings, colors, border, {
			value: filterOpacity($mapSettings.hyperRelayColor),
		})}
		stroke-opacity={getOpacity($mapSettings.hyperRelayColor)}
		stroke-linecap="round"
		stroke-linejoin="round"
		stroke-width={$mapSettings.hyperRelayWidth}
		fill="none"
	/>
{/each}
