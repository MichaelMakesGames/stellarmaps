<script lang="ts">
	import { getModalStore, getToastStore } from '@skeletonlabs/skeleton';
	import { dialog } from '@tauri-apps/api';
	import { fade } from 'svelte/transition';
	import { gameStatePromise } from '../GameState';
	import Map from './Map.svelte';
	import { loadStellarisData, stellarisDataPromiseStore } from '../loadStellarisData';
	import { lastProcessedMapSettings } from '../mapSettings';
	import processMapData from './data/processMapData';
	import { toastError } from '../utils';
	import HeroiconArrowPathOutline from '$lib/icons/HeroiconArrowPathOutline.svelte';

	const modalStore = getModalStore();

	$: mapDataPromise =
		$gameStatePromise?.then((gs) => processMapData(gs, $lastProcessedMapSettings)) ??
		new Promise<Awaited<ReturnType<typeof processMapData>>>(() => {});

	loadStellarisData();
	const toastStore = getToastStore();
	$: $stellarisDataPromiseStore.catch(
		toastError({
			title: 'Failed to load Stellaris data',
			description:
				'Please try manually selecting your install location. This should be the folder that contains the <pre class="inline">common</pre>, <pre class="inline">flags</pre>, and <pre class="inline">localisation</pre> folders (among others).',
			defaultValue: {} as Record<string, string>,
			toastStore,
			action: {
				label: 'Select Install',
				response: () =>
					dialog
						.open({
							directory: true,
							multiple: false,
							title: 'Select Stellaris Install',
						})
						.then((result) => {
							if (typeof result === 'string') {
								loadStellarisData(result);
							}
						}),
			},
		}),
	);
	$: colorsPromise = $stellarisDataPromiseStore.then(({ colors }) => colors);

	let zoomed = false;
	let resetZoom: () => void;

	async function openExportModal() {
		Promise.all([$stellarisDataPromiseStore, mapDataPromise]).then(([{ colors }, mapData]) => {
			modalStore.trigger({ type: 'component', component: 'export', meta: { colors, mapData } });
		});
	}

	$: allAsyncDataPromise = Promise.all([colorsPromise, $gameStatePromise, mapDataPromise]);
	let colorsOrNull: null | Awaited<typeof colorsPromise> = null;
	let dataOrNull: null | Awaited<typeof mapDataPromise> = null;
	$: {
		colorsOrNull = null;
		dataOrNull = null;
		allAsyncDataPromise.then(([colors, _gameState, data]) => {
			colorsOrNull = colors;
			dataOrNull = data;
		});
	}
</script>

<div class="w-full h-full relative" style:background="#111">
	{#if zoomed}
		<button
			type="button"
			class="btn-icon variant-filled absolute top-3 left-3"
			transition:fade
			on:click={() => {
				resetZoom();
				zoomed = false;
			}}
		>
			<HeroiconArrowPathOutline />
		</button>
	{/if}
	<button
		type="button"
		class="btn variant-filled absolute top-3 right-3"
		transition:fade
		on:click={openExportModal}
	>
		Export
	</button>
	{#if !$gameStatePromise}
		<div class="h-full w-full flex items-center">
			<div class="h1 w-full text-center" style="lineHeight: 100%;">
				Select a save in the top left
			</div>
		</div>
	{:else}
		{#await allAsyncDataPromise}
			<div class="h-full w-full flex items-center absolute top-0 left-0">
				<div class="h1 w-full text-center" style="lineHeight: 100%;">
					This could take a few seconds...
				</div>
			</div>
		{/await}
		<Map
			colors={colorsOrNull}
			data={dataOrNull}
			onZoom={() => {
				zoomed = true;
			}}
			bind:resetZoom
		/>
	{/if}
</div>
