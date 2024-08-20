<script lang="ts">
	import { afterUpdate, createEventDispatcher } from 'svelte';
	import debug from '../debug';
	import { mapSettings } from '../settings';
	import BypassLinks from './BypassLinks.svelte';
	import CountryBorders from './CountryBorders.svelte';
	import CountryLabels from './CountryLabels.svelte';
	import Hyperlanes from './Hyperlanes.svelte';
	import Icons from './Icons.svelte';
	import OccupationPatternDefs from './OccupationPatternDefs.svelte';
	import SystemIcons from './SystemIcons.svelte';
	import TerraIncognita from './TerraIncognita.svelte';
	import TerraIncognitaDefs from './TerraIncognitaDefs.svelte';
	import type { MapData } from './data/processMapData';

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

	const dispatch = createEventDispatcher();
	afterUpdate(() => {
		dispatch('map-updated');
	});
</script>

<svg {id} xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
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
				<OccupationPatternDefs colors={colors ?? {}} {data} />
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
				<filter
					id="fade"
					filterUnits="objectBoundingBox"
					x="-50%"
					y="-50%"
					width="200%"
					height="200%"
				>
					<feGaussianBlur in="SourceGraphic" stdDeviation={$mapSettings.borderFillFade * 25} />
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
			<CountryLabels {data} />
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
