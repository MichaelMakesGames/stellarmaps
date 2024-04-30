<script lang="ts">
	import { mapSettings } from '../settings';
	import Glow from './Glow.svelte';
	import type { MapData } from './data/processMapData';
	import { getStrokeAttributes, getStrokeColorAttributes } from './mapUtils';
	export let data: MapData;
	export let colors: Record<string, string>;
	$: knownBypassLinks = data.bypassLinks.filter((w) => !$mapSettings.terraIncognita || w.isKnown);
</script>

{#if $mapSettings.wormholeStroke.enabled}
	{#each knownBypassLinks.filter((b) => b.type === 'wormhole') as bypassLink}
		<Glow enabled={$mapSettings.wormholeStroke.glow} let:filter>
			<path
				d="M {bypassLink.from.x} {bypassLink.from.y} L {bypassLink.to.x} {bypassLink.to.y}"
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

{#if $mapSettings.lGateStroke.enabled}
	{#each knownBypassLinks.filter((b) => b.type === 'lgate') as bypassLink}
		<Glow enabled={$mapSettings.lGateStroke.glow} let:filter>
			<path
				d="M {bypassLink.from.x} {bypassLink.from.y} L {bypassLink.to.x} {bypassLink.to.y}"
				{filter}
				{...getStrokeAttributes($mapSettings.lGateStroke)}
				{...getStrokeColorAttributes({
					mapSettings: $mapSettings,
					colorStack: [$mapSettings.lGateStrokeColor],
					colors,
				})}
			/>
		</Glow>
	{/each}
{/if}

{#if $mapSettings.shroudTunnelStroke.enabled}
	{#each knownBypassLinks.filter((b) => b.type === 'shroud_tunnel') as bypassLink}
		<Glow enabled={$mapSettings.shroudTunnelStroke.glow} let:filter>
			<path
				d="M {bypassLink.from.x} {bypassLink.from.y} L {bypassLink.to.x} {bypassLink.to.y}"
				{filter}
				{...getStrokeAttributes($mapSettings.shroudTunnelStroke)}
				{...getStrokeColorAttributes({
					mapSettings: $mapSettings,
					colorStack: [$mapSettings.shroudTunnelStrokeColor],
					colors,
				})}
			/>
		</Glow>
	{/each}
{/if}
