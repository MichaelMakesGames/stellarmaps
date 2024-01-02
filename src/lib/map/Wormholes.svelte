<script lang="ts">
	import { mapSettings } from '../mapSettings';
	import Glow from './Glow.svelte';
	import type { MapData } from './data/processMapData';
	import { getStrokeAttributes, getStrokeColorAttributes } from './mapUtils';
	export let data: MapData;
	export let colors: Record<string, string>;
</script>

{#if $mapSettings.wormholeStroke.enabled}
	{#each data.wormholes.filter((w) => !$mapSettings.terraIncognita || w.isKnown) as wormhole}
		<Glow enabled={$mapSettings.wormholeStroke.glow} let:filter>
			<path
				d="M {wormhole.from.x} {wormhole.from.y} L {wormhole.to.x} {wormhole.to.y}"
				{filter}
				{...getStrokeAttributes($mapSettings.wormholeStroke)}
				{...getStrokeColorAttributes({
					mapSettings: $mapSettings,
					colorStack: [$mapSettings.wormholeStrokeColor],
					colors,
				})}
			/>
		</Glow>
	{/each}
{/if}
