<script lang="ts">
	import { getModalStore, getToastStore } from '@skeletonlabs/skeleton';
	import { dialog } from '@tauri-apps/api';
	import { fade } from 'svelte/transition';
	import { gameStatePromise } from '../GameState';
	import Map from './Map.svelte';
	import { loadStellarisData, stellarisDataPromiseStore } from '../loadStellarisData';
	import { lastProcessedMapSettings, mapSettings, reprocessMap } from '../mapSettings';
	import processMapData from './data/processMapData';
	import { toastError } from '../utils';

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

	let zoomed = true;
	let resetZoom: () => void;

	async function openExportModal() {
		Promise.all([$stellarisDataPromiseStore, mapDataPromise]).then(([{ colors }, mapData]) => {
			modalStore.trigger({ type: 'component', component: 'export', meta: { colors, mapData } });
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
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="1.5"
				stroke="currentColor"
				class="w-6 h-6"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
				/>
			</svg>
		</button>
	{/if}
	{#if !$gameStatePromise}
		<div class="h-full w-full flex items-center">
			<div class="h1 w-full text-center" style="lineHeight: 100%;">
				Select a save in the top left
			</div>
		</div>
	{:else}
		{#await Promise.all([colorsPromise, $gameStatePromise, mapDataPromise])}
			<div class="h-full w-full flex items-center">
				<div class="h1 w-full text-center" style="lineHeight: 100%;">
					This could take a few seconds...
				</div>
			</div>
		{:then [colors, gameState, data]}
			<button
				type="button"
				class="btn variant-filled absolute top-3 right-3"
				transition:fade
				on:click={openExportModal}
			>
				Export
			</button>
			<Map
				{colors}
				{data}
				onZoom={() => {
					zoomed = true;
				}}
				bind:resetZoom
			/>
		{/await}
	{/if}
</div>
