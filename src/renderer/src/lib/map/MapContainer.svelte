<script lang="ts">
	import { getModalStore, getToastStore } from '@skeletonlabs/skeleton';
	import { select } from 'd3-selection';
	import { ZoomTransform, zoom, zoomIdentity } from 'd3-zoom';
	import { onDestroy } from 'svelte';
	import { fade } from 'svelte/transition';
	import orbitronPath from '../../static/Orbitron-VariableFont_wght.ttf';
	import { gameStatePromise } from '../GameState';
	import { ADDITIONAL_COLORS } from '../colors';
	import convertBlobToDataUrl from '../convertBlobToDataUrl';
	import convertSvgToPng from '../convertSvgToPng';
	import HeroiconArrowPathOutline from '../icons/HeroiconArrowPathOutline.svelte';
	import {
		loadStellarisData,
		stellarisDataPromiseStore,
		stellarisPathStore,
	} from '../loadStellarisData';
	import { lastProcessedMapSettings, mapSettings } from '../mapSettings';
	import stellarMapsApi from '../stellarMapsApi';
	import { debounce, timeItAsync, toastError, wait } from '../utils';
	import Map from './Map.svelte';
	import processMapData from './data/processMapData';
	import { resolveColor } from './mapUtils';

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
					stellarMapsApi.dialog
						.open({
							directory: true,
							multiple: false,
							title: 'Select Stellaris Install',
						})
						.then((result) => {
							if (typeof result === 'string') {
								stellarisPathStore.set(result);
								loadStellarisData();
							}
						}),
			},
		}),
	);
	$: colorsPromise = $stellarisDataPromiseStore.then(({ colors }) => colors);

	async function openExportModal() {
		Promise.all([$stellarisDataPromiseStore, mapDataPromise]).then(([{ colors }, mapData]) => {
			modalStore.trigger({
				type: 'component',
				component: 'export',
				meta: { colors, mapData, svg: mapTarget.firstChild },
			});
		});
	}

	let orbitronPromise = fetch(orbitronPath)
		.then((r) => r.blob())
		.then(convertBlobToDataUrl);
	let orbitronDataUrl = '';
	orbitronPromise.then((url) => {
		orbitronDataUrl = url;
	});

	$: allAsyncDataPromise = wait(3_000).then(() =>
		Promise.all([colorsPromise, $gameStatePromise, mapDataPromise, orbitronPromise]),
	);
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

	let pngDataUrlRequestId: null | string = null;
	let pngDataUrl = '';
	let zoomedPngDataUrlRequestId: null | string = null;
	let zoomedPngDataUrl = '';

	const mapTarget = document.createElement('div');
	const map = new Map({
		target: mapTarget,
		props: {
			colors: colorsOrNull,
			data: dataOrNull,
			orbitronDataUrl: orbitronDataUrl,
		},
	});
	$: {
		map.$set({
			colors: colorsOrNull,
			data: dataOrNull,
			orbitronDataUrl: orbitronDataUrl,
		});
	}
	map.$on('map-updated', () => renderMap());

	let container: HTMLDivElement;
	let outputWidth = container?.clientWidth ?? 0;
	let outputHeight = container?.clientHeight ?? 0;
	const resizeObserver = new ResizeObserver(debounce(renderMap, 100));
	$: if (container) {
		resizeObserver.observe(container);
	} else {
		resizeObserver.disconnect();
	}

	let g: SVGGElement;
	let svg: SVGElement;
	let transform: ZoomTransform | null = null;
	let zoomHandler = zoom().on('zoom', (e) => {
		zoomedPngDataUrl = '';
		zoomedPngDataUrlRequestId = null;
		transform = e.transform;
		if (g) g.setAttribute('transform', transform.toString());
	});
	$: if (svg) {
		select(svg).call(zoomHandler);
	}
	function resetZoom() {
		if (svg) {
			select(svg).call(zoomHandler.transform, zoomIdentity);
		}
		transform = null;
	}

	async function renderMap(onlyRenderZoomed = false) {
		if (!container) return;
		outputWidth = container.clientWidth;
		outputHeight = container.clientHeight;

		let newPngDataUrlRequestId = (Math.random() * 1000000).toFixed(0);
		pngDataUrlRequestId = newPngDataUrlRequestId;
		let newZoomedPngDataUrlRequestId = (Math.random() * 1000000).toFixed(0);
		zoomedPngDataUrlRequestId = newZoomedPngDataUrlRequestId;

		let width = 1000;
		let height = 1000;
		if (outputHeight > outputWidth) {
			height *= outputHeight / outputWidth;
		} else {
			width *= outputWidth / outputHeight;
		}
		let left = -width / 2;
		let top = -height / 2;

		const mapSvg = mapTarget.firstChild as SVGElement;
		let newPngDataUrlPromise = onlyRenderZoomed
			? Promise.resolve(pngDataUrl)
			: dataOrNull == null || colorsOrNull == null
				? Promise.resolve('')
				: convertSvgToPng(mapSvg, { left, top, width, height, outputWidth, outputHeight }).then(
						convertBlobToDataUrl,
					);

		const translateRatio = outputWidth < outputHeight ? 1000 / outputWidth : 1000 / outputHeight;
		left -= ((transform?.x ?? 0) * translateRatio) / (transform?.k ?? 1);
		top -= ((transform?.y ?? 0) * translateRatio) / (transform?.k ?? 1);
		width /= transform?.k ?? 1;
		height /= transform?.k ?? 1;
		const newZoomedPngDataUrlPromise = transform
			? convertSvgToPng(mapSvg, { left, top, width, height, outputWidth, outputHeight }).then(
					convertBlobToDataUrl,
				)
			: Promise.resolve('');

		timeItAsync(
			`render map ${newPngDataUrlRequestId}-${newZoomedPngDataUrlRequestId}`,
			async () => {
				let newPngDataUrl = await newPngDataUrlPromise;
				if (newPngDataUrlRequestId === pngDataUrlRequestId) {
					pngDataUrl = newPngDataUrl;
				}
				let newZoomedPngDataUrl = await newZoomedPngDataUrlPromise;
				if ((newZoomedPngDataUrlRequestId = zoomedPngDataUrlRequestId)) {
					zoomedPngDataUrl = newZoomedPngDataUrl;
				}
			},
		);
	}

	const renderOnTransformChange = debounce(() => renderMap(true), 500);
	$: if (transform || transform == null) {
		renderOnTransformChange();
	}

	onDestroy(() => {
		map.$destroy();
	});
</script>

<div
	class="w-full h-full relative"
	style:background={colorsOrNull == null || dataOrNull == null
		? ADDITIONAL_COLORS.very_black
		: resolveColor({
				mapSettings: $mapSettings,
				colors: colorsOrNull ?? {},
				colorStack: [$mapSettings.backgroundColor],
			})}
	bind:this={container}
>
	{#if transform != null}
		<button
			type="button"
			class="btn-icon variant-filled absolute top-3 left-3"
			transition:fade
			on:click={resetZoom}
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
			<div
				class="h-full w-full flex items-center absolute top-0 left-0"
				style:background="transparent"
			>
				<div class="h1 w-full text-center" style="lineHeight: 100%;">
					This could take a few seconds...
				</div>
			</div>
		{/await}
		{#if pngDataUrl}
			<svg
				bind:this={svg}
				width={outputWidth}
				height={outputHeight}
				viewBox="0 0 {outputWidth} {outputHeight}"
				class="w-full h-full"
			>
				{#if pngDataUrl}
					<g bind:this={g}>
						<image x="0" y="0" width={outputWidth} height={outputHeight} href={pngDataUrl} />
					</g>
				{/if}
				{#if zoomedPngDataUrl}
					<image x="0" y="0" width={outputWidth} height={outputHeight} href={zoomedPngDataUrl} />
				{/if}
			</svg>
		{/if}
	{/if}
</div>
