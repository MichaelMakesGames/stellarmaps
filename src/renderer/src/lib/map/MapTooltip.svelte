<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import type { GalacticObject, GameState } from '../GameState';
	import HeroiconUserMicro from '../icons/HeroiconUserMicro.svelte';
	import { isDefined } from '../utils';
	import { localizeText } from './data/locUtils';
	import { arrow, autoUpdate, computePosition, flip, offset, shift } from '@floating-ui/dom';

	export let x: number;
	export let y: number;
	export let system: GalacticObject;
	export let gameState: null | GameState;

	let targetEl: HTMLDivElement;
	let popupEl: HTMLDivElement;
	let arrowEl: HTMLDivElement;

	function updatePopupPos() {
		computePosition(targetEl, popupEl, {
			placement: 'right-start',
			middleware: [offset(4), flip(), shift(), arrow({ element: arrowEl, padding: 12 })],
		}).then((pos) => {
			popupEl.style.left = `${pos.x}px`;
			popupEl.style.top = `${pos.y}px`;
			popupEl.style.display = 'block';
			const arrowData = pos.middlewareData.arrow;

			const staticSide = {
				top: 'bottom',
				right: 'left',
				bottom: 'top',
				left: 'right',
			}[pos.placement.split('-')[0] ?? 'right'];

			Object.assign(arrowEl.style, {
				left: arrowData?.x != null ? `${arrowData.x}px` : '',
				top: arrowData?.y != null ? `${arrowData.y}px` : '',
				right: '',
				bottom: '',
				...(staticSide ? { [staticSide]: '-5px' } : {}),
			});
		});
	}

	let cleanup: null | (() => void) = null;
	onMount(() => {
		cleanup = autoUpdate(targetEl, popupEl, updatePopupPos);
	});
	onDestroy(() => cleanup?.());

	$: planets = system.colonies
		?.map((planetId) => gameState?.planets.planet[planetId])
		.filter(isDefined)
		.sort((a, b) => (b?.num_sapient_pops ?? 0) - (a?.num_sapient_pops ?? 0));
</script>

<div
	class="absolute w-2 h-4 -ms-1 -mt-2 pointer-events-none"
	style:top="{y}px"
	style:left="{x}px"
	tabindex="-1"
	bind:this={targetEl}
></div>

<div
	data-popup="map-tooltip"
	class="bg-surface-600 py-1 px-2 shadow-sm border border-surface-500 rounded pointer-events-none"
	bind:this={popupEl}
>
	<div class="arrow bg-surface-600" bind:this={arrowEl} />
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
