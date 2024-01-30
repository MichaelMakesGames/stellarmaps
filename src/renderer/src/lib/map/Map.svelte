<script lang="ts">
	import { afterUpdate, createEventDispatcher } from 'svelte';
	import { writable } from 'svelte/store';
	import { mapSettings } from '../mapSettings';
	import BypassLinks from './BypassLinks.svelte';
	import CountryBorders from './CountryBorders.svelte';
	import CountryLabels from './CountryLabels.svelte';
	import Hyperlanes from './Hyperlanes.svelte';
	import Icons from './Icons.svelte';
	import SystemIcons from './SystemIcons.svelte';
	import TerraIncognita from './TerraIncognita.svelte';
	import TerraIncognitaDefs from './TerraIncognitaDefs.svelte';
	import type { MapData } from './data/processMapData';
	import { resolveColor } from './mapUtils';

	export let id: string = '';
	export let data: null | MapData;
	export let colors: null | Record<string, string>;
	export let orbitronDataUrl: string;
	$: fontFace = `<style>
		@font-face {
			font-family: "Orbitron";
			src: url(${orbitronDataUrl});
		}
	</style>`;

	const debug = writable(false);
	(window as any).debug = debug;

	const dispatch = createEventDispatcher();
	afterUpdate(() => {
		dispatch('map-updated');
	});
</script>

<svg {id} xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
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
	{@html fontFace}
	<defs>
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
	<g>
		{#if data && colors}
			<CountryBorders {data} {colors} />
			<Hyperlanes {data} {colors} />
			<TerraIncognita {data} />
			<BypassLinks {data} {colors} />
			<SystemIcons {data} {colors} />
			<CountryLabels {data} debug={$debug} />
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
