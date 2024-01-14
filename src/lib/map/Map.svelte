<script lang="ts">
	import { select } from 'd3-selection';
	import { zoom, zoomIdentity } from 'd3-zoom';
	import { writable } from 'svelte/store';
	import { ORBITRON_BASE64 } from '../ORBITRON_BASE64';
	import { mapSettings } from '../mapSettings';
	import CountryBorders from './CountryBorders.svelte';
	import CountryLabels from './CountryLabels.svelte';
	import Hyperlanes from './Hyperlanes.svelte';
	import SystemIcons from './SystemIcons.svelte';
	import TerraIncognita from './TerraIncognita.svelte';
	import TerraIncognitaDefs from './TerraIncognitaDefs.svelte';
	import type { MapData } from './data/processMapData';
	import { resolveColor } from './mapUtils';
	import BypassLinks from './BypassLinks.svelte';
	import Icons from './Icons.svelte';

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
	style:background={colors
		? resolveColor({
				mapSettings: $mapSettings,
				colors,
				colorStack: [$mapSettings.backgroundColor],
			})
		: 'rgb(17,17,17)'}
	bind:this={svg}
>
	<defs>
		{#if exportMode}
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
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
				<filter
					id="glow"
					filterUnits="objectBoundingBox"
					x="-50%"
					y="-50%"
					width="200%"
					height="200%"
				>
					<feGaussianBlur in="SourceGraphic" stdDeviation="2" />
					<!-- this actually just blurs;
						for a glow effect, apply this filter, then layer a duplicate non-filtered element on top;
						other approaches resulted in a pixellated look when zoomed in (at least when rendered with WebKitGTK)
					-->
				</filter>
			{/each}
		{/if}
		<Icons />
	</defs>
	<rect
		x="-1000"
		y="-1000"
		width="2000"
		height="2000"
		fill={colors
			? resolveColor({
					mapSettings: $mapSettings,
					colors,
					colorStack: [$mapSettings.backgroundColor],
				})
			: 'rgb(17,17,17)'}
	/>
	<g bind:this={g}>
		{#if data && colors}
			<CountryBorders {data} {colors} />
			<Hyperlanes {data} {colors} />
			<TerraIncognita {data} />
			<BypassLinks {data} {colors} />
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
