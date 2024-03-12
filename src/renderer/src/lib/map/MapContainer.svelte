<script lang="ts">
	import { getModalStore, getToastStore } from '@skeletonlabs/skeleton';
	import { select } from 'd3-selection';
	import { ZoomTransform, zoom, zoomIdentity } from 'd3-zoom';
	import { onDestroy } from 'svelte';
	import { get } from 'svelte/store';
	import { fade } from 'svelte/transition';
	import orbitronPath from '../../static/Orbitron-VariableFont_wght.ttf';
	import { gameStatePromise, type GalacticObject, type GameState } from '../GameState';
	import { ADDITIONAL_COLORS } from '../colors';
	import convertBlobToDataUrl from '../convertBlobToDataUrl';
	import convertSvgToPng from '../convertSvgToPng';
	import debug from '../debug';
	import HeroiconArrowsPointingOut from '../icons/HeroiconArrowsPointingOut.svelte';
	import {
		loadStellarisData,
		stellarisDataPromiseStore,
		stellarisPathStore,
	} from '../loadStellarisData';
	import { lastProcessedMapSettings, mapSettings } from '../mapSettings';
	import stellarMapsApi from '../stellarMapsApi';
	import { debounce, timeItAsync, toastError } from '../utils';
	import Map from './Map.svelte';
	import MapTooltip from './MapTooltip.svelte';
	import processMapData from './data/processMapData';
	import { getBackgroundColor } from './mapUtils';
	import processStarScape from './starScape/renderStarScape';

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
				meta: { colors, mapData, gameState: gameStateOrNull, svg: mapTarget.firstChild },
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

	$: allAsyncDataPromise = Promise.all([
		colorsPromise,
		$gameStatePromise,
		mapDataPromise,
		orbitronPromise,
	]);
	let colorsOrNull: null | Awaited<typeof colorsPromise> = null;
	let gameStateOrNull: null | GameState = null;
	let dataOrNull: null | Awaited<typeof mapDataPromise> = null;
	$: {
		colorsOrNull = null;
		gameStateOrNull = null;
		dataOrNull = null;
		allAsyncDataPromise.then(([colors, gameState, data]) => {
			colorsOrNull = colors;
			gameStateOrNull = gameState;
			dataOrNull = data;
		});
	}

	let pngDataUrlRequestId: null | string = null;
	let pngDataUrl = '';
	let zoomedPngDataUrlRequestId: null | string = null;
	let zoomedPngDataUrl = '';
	let starScapeDataUrlRequestId: null | string = null;
	let starScapeDataUrl = '';
	let unzoomedStarScapeDataUrl = '';

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
	let outputWidth = 0;
	let outputHeight = 0;

	let resizing = false;
	const onResizeEnd = debounce(() => {
		resetZoom();
		renderMap().then(() => {
			resizing = false;
		});
	}, 250);
	const resizeObserver = new ResizeObserver(() => {
		tooltip = null;
		resizing = true;
		pngDataUrl = '';
		zoomedPngDataUrl = '';
		lastRenderedTransformPngDataUrl = '';
		lastRenderedTransform = null;
		starScapeDataUrl = '';
		unzoomedStarScapeDataUrl = '';
		lastRenderedTransformStarScapePngDataUrl = '';
		lastRenderedTransformStarScape = null;
		onResizeEnd();
	});
	$: if (container) {
		resizeObserver.observe(container);
	} else {
		resizeObserver.disconnect();
	}

	let g: SVGGElement;
	let svg: SVGElement;
	let transform: ZoomTransform | null = null;
	let lastRenderedTransform: ZoomTransform | null = null;
	let lastRenderedTransformPngDataUrl = '';
	let lastRenderedTransformStarScape: ZoomTransform | null = null;
	let lastRenderedTransformStarScapePngDataUrl = '';
	let zooming = false;
	let endZooming = debounce(() => {
		zooming = false;
	}, 100);
	let zoomHandler = zoom().on('zoom', (e) => {
		tooltip = null;
		zooming = true;
		endZooming();
		zoomedPngDataUrl = '';
		zoomedPngDataUrlRequestId = null;
		starScapeDataUrl = '';
		starScapeDataUrlRequestId = null;
		transform = e.transform;
		if (g) g.setAttribute('transform', e.transform.toString());
	});
	$: if (svg) {
		select(svg).call(zoomHandler as any);
	}
	function resetZoom() {
		if (svg) {
			select(svg).call(zoomHandler.transform as any, zoomIdentity);
		}
		transform = null;
	}

	let pngDataUrlPromise = Promise.resolve('');
	async function renderMap(onlyRenderZoomed = false) {
		if (!container) return;
		outputWidth = container.clientWidth;
		outputHeight = container.clientHeight;

		let newPngDataUrlRequestId = (Math.random() * 1000000).toFixed(0);
		pngDataUrlRequestId = newPngDataUrlRequestId;
		let newZoomedPngDataUrlRequestId = (Math.random() * 1000000).toFixed(0);
		zoomedPngDataUrlRequestId = newZoomedPngDataUrlRequestId;
		let newStarScapeDataUrlRequestId = (Math.random() * 1000000).toFixed(0);
		starScapeDataUrlRequestId = newStarScapeDataUrlRequestId;

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
				? Promise.resolve(pngDataUrl)
				: convertSvgToPng(mapSvg, { left, top, width, height, outputWidth, outputHeight }).then(
						convertBlobToDataUrl,
					);
		if (!onlyRenderZoomed) {
			pngDataUrlPromise = newPngDataUrlPromise;
		}

		const translateRatio = outputWidth < outputHeight ? 1000 / outputWidth : 1000 / outputHeight;
		left -= ((transform?.x ?? 0) * translateRatio) / (transform?.k ?? 1);
		top -= ((transform?.y ?? 0) * translateRatio) / (transform?.k ?? 1);
		width /= transform?.k ?? 1;
		height /= transform?.k ?? 1;
		let newRenderedTransform = transform;
		const newZoomedPngDataUrlPromise = transform
			? convertSvgToPng(mapSvg, { left, top, width, height, outputWidth, outputHeight }).then(
					convertBlobToDataUrl,
				)
			: Promise.resolve('');

		const newStarScapeDataUrlPromise =
			gameStateOrNull && colorsOrNull
				? processStarScape(
						gameStateOrNull,
						$mapSettings,
						colorsOrNull,
						{
							left,
							top,
							width,
							height,
						},
						{ width: outputWidth, height: outputHeight },
					)
				: Promise.resolve('');

		async function finalizeRender() {
			let newPngDataUrl = await newPngDataUrlPromise;
			if (newPngDataUrlRequestId === pngDataUrlRequestId) {
				pngDataUrl = newPngDataUrl;
			}
			let newZoomedPngDataUrl = await newZoomedPngDataUrlPromise;
			if (newZoomedPngDataUrlRequestId === zoomedPngDataUrlRequestId) {
				lastRenderedTransform = newRenderedTransform;
				lastRenderedTransformPngDataUrl = newZoomedPngDataUrl;
				zoomedPngDataUrl = newZoomedPngDataUrl;
			}
			let newStarScapeDataUrl = await newStarScapeDataUrlPromise;
			if (newStarScapeDataUrlRequestId === starScapeDataUrlRequestId) {
				if (newRenderedTransform == null) {
					unzoomedStarScapeDataUrl = newStarScapeDataUrl;
					lastRenderedTransformStarScapePngDataUrl = '';
					starScapeDataUrl = '';
				} else {
					lastRenderedTransformStarScape = newRenderedTransform;
					lastRenderedTransformStarScapePngDataUrl = newStarScapeDataUrl;
					starScapeDataUrl = newStarScapeDataUrl;
				}
			}
		}
		if ($debug) {
			timeItAsync(
				`render map ${newPngDataUrlRequestId}-${newZoomedPngDataUrlRequestId}`,
				finalizeRender,
			);
		} else {
			finalizeRender();
		}
	}

	const renderOnTransformChange = debounce(() => renderMap(true), 500);
	$: if (transform || transform == null) {
		renderOnTransformChange();
	}

	$: bg =
		dataOrNull == null
			? ADDITIONAL_COLORS.very_black
			: getBackgroundColor(colorsOrNull, $mapSettings);

	onDestroy(() => {
		map.$destroy();
	});

	const TOOLTIP_MAX_DISTANCE = 32;
	const TOOLTIP_AUTOCLOSE_DISTANCE = TOOLTIP_MAX_DISTANCE * 2;
	let tooltip: {
		x: number;
		y: number;
		system: GalacticObject;
	} | null = null;
	function onMouseMoveInner(e: MouseEvent) {
		if (dataOrNull != null && !resizing && !zooming) {
			let viewBoxWidth = 1000;
			let viewBoxHeight = 1000;
			if (outputHeight > outputWidth) {
				viewBoxHeight *= outputHeight / outputWidth;
			} else {
				viewBoxWidth *= outputWidth / outputHeight;
			}
			const svgPoint: [number, number] = [
				((transform || zoomIdentity).invertX(e.offsetX) * viewBoxWidth) / outputWidth -
					viewBoxWidth / 2,
				((transform || zoomIdentity).invertY(e.offsetY) * viewBoxHeight) / outputHeight -
					viewBoxHeight / 2,
			];
			const system = dataOrNull.findClosestSystem(-svgPoint[0], svgPoint[1]);
			if (system) {
				const settings = get(mapSettings);
				const processedSystem = dataOrNull?.systems.find((s) => s.id === system.id);
				if (processedSystem == null) {
					tooltip = null;
				} else {
					const systemPoint: [number, number] = [processedSystem.x, processedSystem.y];
					const tooltipPoint: [number, number] = [
						(transform || zoomIdentity).applyX(
							((systemPoint[0] + viewBoxWidth / 2) * outputWidth) / viewBoxWidth,
						),
						(transform || zoomIdentity).applyY(
							((systemPoint[1] + viewBoxHeight / 2) * outputHeight) / viewBoxHeight,
						),
					];

					if (settings.terraIncognita && !processedSystem.systemIsKnown) {
						tooltip = null;
					} else if (
						Math.hypot(tooltipPoint[0] - e.offsetX, tooltipPoint[1] - e.offsetY) >
						TOOLTIP_MAX_DISTANCE
					) {
						tooltip = null;
					} else {
						tooltip = {
							x: tooltipPoint[0],
							y: tooltipPoint[1],
							system: system,
						};
					}
				}
			}
		}
	}
	const onMouseMoveInnerDebounced = debounce(onMouseMoveInner, 50);
	function onMouseMove(e: MouseEvent) {
		if (
			tooltip &&
			Math.hypot(tooltip.x - e.offsetX, tooltip.y - e.offsetY) > TOOLTIP_AUTOCLOSE_DISTANCE
		) {
			tooltip = null;
		}
		onMouseMoveInnerDebounced(e);
	}
</script>

<div class="relative h-full w-full" style:background={bg} bind:this={container}>
	{#if transform != null}
		<button
			type="button"
			class="variant-filled btn-icon absolute left-3 top-3"
			transition:fade
			on:click={resetZoom}
		>
			<HeroiconArrowsPointingOut />
		</button>
	{/if}
	<button
		type="button"
		class="variant-filled btn absolute right-3 top-3"
		transition:fade
		on:click={openExportModal}
	>
		Export
	</button>
	{#if tooltip != null && !zooming && !resizing}
		<div class="pointer-events-none absolute left-0 top-0 h-full w-full overflow-hidden">
			<MapTooltip {...tooltip} gameState={gameStateOrNull} />
		</div>
	{/if}
	{#if !$gameStatePromise}
		<div class="flex h-full w-full items-center" style:background={bg}>
			<div class="h1 w-full text-center" style="lineHeight: 100%;">
				Select a save in the top left
			</div>
		</div>
	{:else if resizing}
		<div class="flex h-full w-full items-center" style:background={bg}>
			<div class="h1 w-full text-center" style="lineHeight: 100%;">Resizing...</div>
		</div>
	{:else}
		{#await Promise.all([pngDataUrlPromise, allAsyncDataPromise])}
			<div
				class="absolute left-0 top-0 flex h-full w-full items-center backdrop-blur backdrop-brightness-75"
			>
				<div class="h1 w-full text-center" style="lineHeight: 100%;">
					This could take a few seconds...
				</div>
			</div>
		{:catch reason}
			<div class="absolute left-0 top-0 flex h-full w-full items-center bg-error-800">
				<div class="h1 w-full text-center text-error-200">
					Something has gone wrong
					<br />
					<code class="mt-3 inline-block max-w-96 text-sm">
						{reason.toString().length > 200
							? `${reason.toString().substring(0, 200)}...`
							: reason.toString()}
					</code>
				</div>
			</div>
		{/await}
		<!-- svelte-ignore a11y-mouse-events-have-key-events -->
		<svg
			bind:this={svg}
			width={outputWidth}
			height={outputHeight}
			viewBox="0 0 {outputWidth} {outputHeight}"
			role="presentation"
			on:mousemove={onMouseMove}
			on:mouseout={() => {
				tooltip = null;
			}}
			class="h-full w-full"
		>
			<g transform={transform?.toString()}>
				{#if unzoomedStarScapeDataUrl}
					<image
						x="0"
						y="0"
						width={outputWidth}
						height={outputHeight}
						href={unzoomedStarScapeDataUrl}
					/>
				{/if}
			</g>
			<g bind:this={g}>
				{#if pngDataUrl}
					<image x="0" y="0" width={outputWidth} height={outputHeight} href={pngDataUrl} />
				{/if}
			</g>
			{#if starScapeDataUrl}
				<rect
					x="0"
					y="0"
					width={outputWidth}
					height={outputHeight}
					fill={getBackgroundColor(colorsOrNull, $mapSettings)}
				/>
				<image x="0" y="0" width={outputWidth} height={outputHeight} href={starScapeDataUrl} />
			{:else if lastRenderedTransformStarScapePngDataUrl}
				<g transform={transform?.toString()}>
					<rect
						x="0"
						y="0"
						width={outputWidth}
						height={outputHeight}
						fill={getBackgroundColor(colorsOrNull, $mapSettings)}
						transform={lastRenderedTransformStarScape
							? `scale(${
									1 / lastRenderedTransformStarScape.k
								}) translate(${-lastRenderedTransformStarScape.x},${-lastRenderedTransformStarScape.y})`
							: undefined}
					/>
					<image
						x="0"
						y="0"
						width={outputWidth}
						height={outputHeight}
						href={lastRenderedTransformStarScapePngDataUrl}
						transform={lastRenderedTransformStarScape
							? `scale(${
									1 / lastRenderedTransformStarScape.k
								}) translate(${-lastRenderedTransformStarScape.x},${-lastRenderedTransformStarScape.y})`
							: undefined}
					/>
				</g>
			{/if}
			{#if zoomedPngDataUrl}
				<image x="0" y="0" width={outputWidth} height={outputHeight} href={zoomedPngDataUrl} />
			{:else if lastRenderedTransformPngDataUrl}
				<g transform={transform?.toString()}>
					<image
						x="0"
						y="0"
						width={outputWidth}
						height={outputHeight}
						href={lastRenderedTransformPngDataUrl}
						transform={lastRenderedTransform
							? `scale(${
									1 / lastRenderedTransform.k
								}) translate(${-lastRenderedTransform.x},${-lastRenderedTransform.y})`
							: undefined}
					/>
				</g>
			{/if}
		</svg>
	{/if}
</div>
