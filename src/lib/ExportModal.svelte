<script lang="ts">
	import {
		RangeSlider,
		SlideToggle,
		getModalStore,
		getToastStore,
		localStorageStore,
	} from '@skeletonlabs/skeleton';
	import { mapSettings } from './mapSettings';
	import Map from './map/Map.svelte';
	import { dialog, fs, path } from '@tauri-apps/api';
	import { toastError, wait } from './utils';
	import { reveal_file } from './tauriCommands';
	import { resolveColor } from './map/mapUtils';
	import type { MapData } from './map/data/processMapData';
	const modalStore = getModalStore();
	const toastStore = getToastStore();
	const colors: Record<string, string> = $modalStore[0].meta?.colors;
	const mapData: MapData = $modalStore[0].meta?.mapData;

	let hiddenDiv: HTMLDivElement;

	const defaultExportSettings = {
		lockAspectRatio: true,
		lockedAspectRatio: [1, 1],
		imageWidth: 4096,
		imageHeight: 4096,
		centerX: 0,
		centerY: 0,
		invertCenterX: false,
		invertCenterY: true,
		zoom: 0,
	};
	const exportSettings = localStorageStore('exportSettings', defaultExportSettings);
	let lockAspectRatio = $exportSettings.lockAspectRatio;
	let lockedAspectRatio = $exportSettings.lockedAspectRatio;
	let imageWidth = $exportSettings.imageWidth;
	let imageHeight = $exportSettings.imageHeight;
	let centerX = $exportSettings.centerX;
	let centerY = $exportSettings.centerY;
	let invertCenterX = $exportSettings.invertCenterX;
	let invertCenterY = $exportSettings.invertCenterY;
	let zoom = $exportSettings.zoom;
	$: scale = 1 / (zoom >= 0 ? 1 + zoom : 1 / (1 - zoom));
	$: mapWidth =
		imageHeight > imageWidth
			? 1000 * scale
			: (1000 * scale * lockedAspectRatio[1]) / lockedAspectRatio[0];
	$: mapHeight =
		imageWidth > imageHeight
			? 1000 * scale
			: (1000 * scale * lockedAspectRatio[0]) / lockedAspectRatio[1];
	$: mapLeft = (invertCenterX ? -centerX : centerX) - mapWidth / 2;
	$: mapTop = (invertCenterY ? -centerY : centerY) - mapHeight / 2;
	$: viewBoxLeft = Math.min(-500, mapLeft);
	$: viewBoxTop = Math.min(-500, mapTop);
	$: viewBoxWidth =
		viewBoxLeft < -500
			? Math.max(mapWidth, 500 - viewBoxLeft)
			: Math.max(1000, 500 + mapLeft + mapWidth);
	$: viewBoxHeight =
		viewBoxTop < -500
			? Math.max(mapHeight, 500 - viewBoxTop)
			: Math.max(1000, 500 + mapTop + mapHeight);

	function closeAndSaveSettings() {
		exportSettings.set({
			lockAspectRatio,
			lockedAspectRatio,
			imageWidth,
			imageHeight,
			centerX,
			centerY,
			invertCenterX,
			invertCenterY,
			zoom,
		});
		modalStore.close();
	}

	function onPreviewClick(this: SVGElement, event: MouseEvent) {
		const boundingRect = this.getBoundingClientRect();
		const svgXPercent = (event.clientX - boundingRect.left) / boundingRect.width;
		const svgYPercent = (event.clientY - boundingRect.top) / boundingRect.height;
		centerX = Math.round(viewBoxLeft + viewBoxWidth * svgXPercent) * (invertCenterX ? -1 : 1);
		if (centerX < 0) {
			centerX *= -1;
			invertCenterX = !invertCenterX;
		}
		centerY = Math.round(viewBoxTop + viewBoxHeight * svgYPercent) * (invertCenterY ? -1 : 1);
		if (centerY < 0) {
			centerY *= -1;
			invertCenterY = !invertCenterY;
		}
	}

	async function exportPng() {
		const svg = document.querySelector('#export-svg')?.outerHTML;
		const canvas = document.createElement('canvas');
		canvas.height = imageHeight;
		canvas.width = imageWidth;
		const ctx = canvas.getContext('2d');
		if (!svg || !ctx) {
			console.error('no svg and/or no ctx');
			return;
		}
		const svgUrl = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
		const img = document.createElement('img');
		img.height = imageHeight;
		img.width = imageWidth;
		hiddenDiv.appendChild(img);
		const promise = new Promise<void>((resolve, reject) => {
			img.addEventListener(
				'load',
				async function () {
					// the data url images within the SVG haven't necessarily loaded at this point
					// wait a bit to give them time to render
					await wait(500);
					ctx.drawImage(img, 0, 0);
					canvas.toBlob(
						async (b) => {
							if (b == null) {
								reject('canvas.toBlob failed');
							} else {
								const savePath = await dialog.save({
									defaultPath: await path.join(await path.pictureDir(), 'map.png'),
									filters: [{ extensions: ['png'], name: 'Image' }],
								});
								if (savePath) {
									await fs.writeBinaryFile(savePath, await b.arrayBuffer()).then(() => {
										toastStore.trigger({
											background: 'variant-filled-success',
											message: 'Export Successful',
											timeout: 10000,
											action: {
												label: `
													<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
														<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" />
													</svg>
												`,
												response: () => reveal_file(savePath),
											},
										});
									});
									resolve();
								} else {
									resolve();
								}
							}
						},
						'image/png',
						0.95,
					);
					hiddenDiv.removeChild(img);
				},
				{ once: true },
			);
		});
		img.src = svgUrl;
		await promise;
	}

	async function exportSvg() {
		const svg = document.querySelector('#export-svg')?.outerHTML;
		const savePath = await dialog.save({
			defaultPath: await path.join(await path.pictureDir(), 'map.svg'),
			filters: [{ extensions: ['svg'], name: 'Image' }],
		});
		if (savePath && svg) {
			await fs.writeFile(savePath, svg).then(() => {
				toastStore.trigger({
					background: 'variant-filled-success',
					message: 'Export Successful',
					timeout: 10000,
					action: {
						label: `
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
								<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" />
							</svg>
						`,
						response: () => reveal_file(savePath),
					},
				});
			});
			return;
		} else {
			return;
		}
	}

	let processing = false;
	async function onSubmit(exporter: () => Promise<void>) {
		processing = true;
		try {
			await exporter();
			closeAndSaveSettings();
		} catch (error) {
			toastError({
				title: 'Export Failed',
				defaultValue: null,
				toastStore,
			})(error);
			processing = false;
		}
	}
</script>

<form
	class="modal block overflow-y-auto bg-surface-100-800-token w-[60rem] h-auto p-4 space-y-4 rounded-container-token shadow-xl"
	role="dialog"
	aria-modal="true"
	on:submit={() => onSubmit(exportPng)}
	novalidate
>
	<header class="modal-header text-2xl font-bold">Export PNG</header>
	<article class="modal-body flex space-x-5">
		<div class="inline-block w-0 flex-1">
			<div class="mb-1 flex justify-between">
				<p>Image Size</p>
				<small class="flex">
					Lock Aspect Ratio <SlideToggle
						size="sm"
						name="lock-aspect-ratio"
						class="ml-1"
						disabled={processing || !imageHeight || !imageWidth}
						active="variant-filled-secondary"
						bind:checked={lockAspectRatio}
					/>
				</small>
			</div>
			<div class="input-group input-group-divider grid-cols-[auto_3rem_3rem_auto_3rem]">
				<input
					type="number"
					disabled={processing}
					bind:value={imageWidth}
					on:input={() => {
						if (imageWidth && lockAspectRatio) {
							imageHeight = Math.round((imageWidth * lockedAspectRatio[0]) / lockedAspectRatio[1]);
						}
						if (imageWidth && imageHeight && !lockAspectRatio) {
							lockedAspectRatio = [imageHeight, imageWidth];
						}
					}}
				/>
				<div class="input-group-shim !px-0 !justify-center">px</div>
				<div class="input-group-shim">×</div>
				<input
					type="number"
					disabled={processing}
					bind:value={imageHeight}
					on:input={() => {
						if (imageHeight && lockAspectRatio) {
							imageWidth = Math.round((imageHeight * lockedAspectRatio[1]) / lockedAspectRatio[0]);
						}
						if (imageWidth && imageHeight && !lockAspectRatio) {
							lockedAspectRatio = [imageHeight, imageWidth];
						}
					}}
				/>
				<div class="input-group-shim !px-0 !justify-center">px</div>
			</div>
			<p class="mt-3 mb-1">Zoom</p>
			<RangeSlider
				disabled={processing}
				name="zoom"
				min={-9}
				max={9}
				step={0.1}
				bind:value={zoom}
			/>
			<p class="mt-3 mb-1">
				Center <span class="text-surface-300 ml-1">(The galaxy is about 1000 units across.)</span>
			</p>
			<div class="input-group input-group-divider grid-cols-[auto_3rem_3rem_auto_3rem]">
				<input
					type="number"
					disabled={processing}
					bind:value={centerX}
					on:blur={() => {
						if (centerX < 0) {
							centerX = -centerX;
							invertCenterX = !invertCenterX;
						}
					}}
				/>
				<button
					disabled={processing}
					class="variant-filled-secondary !justify-center"
					on:click={() => {
						invertCenterX = !invertCenterX;
					}}
				>
					{invertCenterX ? 'W' : 'E'}
				</button>
				<div class="input-group-shim">×</div>
				<input
					type="number"
					disabled={processing}
					bind:value={centerY}
					on:blur={() => {
						if (centerY < 0) {
							centerY = -centerY;
							invertCenterY = !invertCenterY;
						}
					}}
				/>
				<button
					disabled={processing}
					class="variant-filled-secondary !justify-center"
					on:click={() => {
						invertCenterY = !invertCenterY;
					}}
				>
					{invertCenterY ? 'N' : 'S'}
				</button>
			</div>
		</div>
		<aside class="inline-block w-[12rem] flex-initial">
			<p>
				Preview: <small>(Click to center)</small>
			</p>
			<!-- svelte-ignore a11y-click-events-have-key-events a11y-interactive-supports-focus -->
			<svg
				id="map-svg"
				xmlns="http://www.w3.org/2000/svg"
				viewBox="{viewBoxLeft} {viewBoxTop} {viewBoxWidth} {viewBoxHeight}"
				width="1000"
				height="1000"
				class="w-[12rem] h-[12rem]"
				style="background: {resolveColor($mapSettings, colors, null, {
					value: $mapSettings.backgroundColor,
				})};"
				on:click={onPreviewClick}
				role="button"
				style:cursor="pointer"
			>
				{#if mapData}
					{#each mapData.borders as border}
						<path
							id="border-{border.countryId}-outer"
							d={border.outerPath}
							fill={resolveColor($mapSettings, colors, border, { value: $mapSettings.borderColor })}
						/>
						<path
							id="border-{border.countryId}-inner"
							d={border.innerPath}
							fill={resolveColor($mapSettings, colors, border, {
								value: $mapSettings.borderFillColor,
							})}
						/>
					{/each}
					{#if $mapSettings.terraIncognita}
						<path
							id="terra-incognita-fallback"
							d={mapData.terraIncognitaPath}
							fill={`rgba(${$mapSettings.terraIncognitaBrightness},${$mapSettings.terraIncognitaBrightness},${$mapSettings.terraIncognitaBrightness})`}
						/>
					{/if}
				{/if}
				<path
					fill="rgba(150, 150, 150, 0.5)"
					stroke="white"
					stroke-width={Math.max(viewBoxWidth, viewBoxHeight) / 100}
					d="M -100000 -100000 h 200000 v 200000 h -200000 v -200000 M {mapLeft} {mapTop} v {mapHeight} h {mapWidth} v -{mapHeight} h -{mapWidth}"
				/>
			</svg>
		</aside>
		<div class="hidden" bind:this={hiddenDiv}>
			<Map
				id="export-svg"
				data={mapData}
				{colors}
				exportMode
				exportModeViewBox="{mapLeft} {mapTop} {mapWidth} {mapHeight}"
				exportWidth={imageWidth}
				exportHeight={imageHeight}
			/>
		</div>
	</article>
	<footer class="modal-footer flex justify-end space-x-2">
		<button
			type="button"
			class="btn variant-ghost-surface"
			on:click={() => {
				exportSettings.set(defaultExportSettings);
				lockAspectRatio = defaultExportSettings.lockAspectRatio;
				lockedAspectRatio = defaultExportSettings.lockedAspectRatio;
				imageWidth = defaultExportSettings.imageWidth;
				imageHeight = defaultExportSettings.imageHeight;
				centerX = defaultExportSettings.centerX;
				centerY = defaultExportSettings.centerY;
				invertCenterX = defaultExportSettings.invertCenterX;
				invertCenterY = defaultExportSettings.invertCenterY;
				zoom = defaultExportSettings.zoom;
			}}
			disabled={processing}
		>
			Reset
		</button>
		<button
			type="button"
			class="btn variant-ghost-surface"
			on:click={modalStore.close}
			disabled={processing}
		>
			Cancel
		</button>
		<button
			type="button"
			class="btn variant-filled-tertiary"
			disabled={processing}
			on:click={() => onSubmit(exportSvg)}
		>
			{processing ? 'Processing...' : 'Export SVG'}
		</button>
		<button type="submit" class="btn variant-filled-primary" disabled={processing}>
			{processing ? 'Processing...' : 'Export PNG'}
		</button>
	</footer>
</form>
