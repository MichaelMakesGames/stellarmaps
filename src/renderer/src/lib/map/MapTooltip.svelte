<script lang="ts">
	import type { GalacticObject, GameState } from '../GameState';
	import HeroiconUserMicro from '../icons/HeroiconUserMicro.svelte';
	import { isDefined } from '../utils';
	import { localizeText } from './data/locUtils';

	export let x: number;
	export let y: number;
	export let system: GalacticObject;
	export let gameState: null | GameState;

	$: planets = system.colonies
		?.map((planetId) => gameState?.planets.planet[planetId])
		.filter(isDefined)
		.sort((a, b) => (b?.num_sapient_pops ?? 0) - (a?.num_sapient_pops ?? 0));
</script>

<div
	class="bg-surface-900 py-1 px-2 absolute shadow-sm border border-surface-700 rounded"
	style:top="{y}px"
	style:left="{x}px"
	style:transform="translate(0.5rem, -50%)"
>
	{#await localizeText(system.name)}
		Loading...
	{:then name}
		{name}
	{/await}
	{#if planets}
		<ul class="ps-3">
			{#each planets as planet}
				<li class="flex flex-row justify-between text-sm">
					<span>
						{#await localizeText(planet.name)}
							Loading...
						{:then name}
							{name}
						{/await}
					</span>
					<span class="inline-block ms-3">
						{planet.num_sapient_pops}<HeroiconUserMicro class="w-3 h-3 inline" />
					</span>
				</li>
			{/each}
		</ul>
	{/if}
</div>
