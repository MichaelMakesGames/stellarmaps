<script lang="ts">
	import { select } from 'd3-selection';
	import { zoom, zoomIdentity } from 'd3-zoom';
	import { writable } from 'svelte/store';
	import { ORBITRON_BASE64 } from '../ORBITRON_BASE64';
	import { mapSettings } from '../mapSettings';
	import type { MapData } from './data/processMapData';
	import CountryBorders from './CountryBorders.svelte';
	import CountryLabels from './CountryLabels.svelte';
	import Hyperlanes from './Hyperlanes.svelte';
	import SystemIcons from './SystemIcons.svelte';
	import TerraIncognita from './TerraIncognita.svelte';
	import TerraIncognitaDefs from './TerraIncognitaDefs.svelte';
	import { resolveColor } from './mapUtils';

	export let id: string = '';
	export let data: null | MapData;
	export let colors: null | Record<string, string>;
	export let onZoom: undefined | (() => void) = undefined;
	export let exportMode: boolean = false;
	export let exportModeViewBox: string = '';
	export let exportWidth: number = 1000;
	export let exportHeight: number = 1000;

	const styles = `<style>@font-face { font-family: "Orbitron"; src: url(${ORBITRON_BASE64}); }</style>`;

	const debug = writable(false);
	(window as any).debug = debug;

	let svg: null | Element = null;
	let g: null | SVGGElement = null;
	let zoomHandler = zoom().on('zoom', ({ transform }) => {
		onZoom?.();
		if (g) g.setAttribute('transform', transform);
	});
	$: if (svg && !exportMode) {
		select(svg).call(zoomHandler);
	}
	export const resetZoom = () => {
		if (svg) {
			select(svg).call(zoomHandler.transform, zoomIdentity);
		}
	};
</script>

<svg
	{id}
	xmlns="http://www.w3.org/2000/svg"
	viewBox={exportMode ? exportModeViewBox : '-500 -500 1000 1000'}
	width={exportMode ? exportWidth : undefined}
	height={exportMode ? exportHeight : undefined}
	class={exportMode ? undefined : 'w-full h-full'}
	style="text-shadow: 0px 0px 3px black;"
	bind:this={svg}
>
	<defs>
		{#if exportMode}
			{@html styles}
		{/if}
		{#if data}
			{#each data.borders.filter((border) => border.isKnown || !$mapSettings.terraIncognita) as border}
				<clipPath id="border-{border.countryId}-inner-clip-path">
					<use href="#border-{border.countryId}-inner" />
				</clipPath>
				<clipPath id="border-{border.countryId}-outer-clip-path">
					<use href="#border-{border.countryId}-outer" />
				</clipPath>
				<TerraIncognitaDefs />
			{/each}
		{/if}
	</defs>
	<rect
		x="-1000"
		y="-1000"
		width="2000"
		height="2000"
		fill={colors
			? resolveColor($mapSettings, colors, null, { value: $mapSettings.backgroundColor })
			: 'rgb(17,17,17)'}
	/>
	<g bind:this={g}>
		{#if data && colors}
			<CountryBorders {data} {colors} />
			<Hyperlanes {data} {colors} />
			<TerraIncognita {data} />
			<SystemIcons {data} {colors} />
			<CountryLabels {data} {exportMode} debug={$debug} />
			{#if $debug}
				{#each data.galaxyBorderCircles as circle}
					<circle
						cx={-circle.cx}
						cy={circle.cy}
						r={circle.r}
						stroke-width={['outer-padded', 'inner-padded', 'outlier'].includes(circle.type) ? 2 : 1}
						stroke={circle.type === 'outlier'
							? 'green'
							: circle.type.startsWith('outer')
							? 'blue'
							: 'red'}
						fill="transparent"
					/>
				{/each}
			{/if}
		{/if}
	</g>
</svg>
