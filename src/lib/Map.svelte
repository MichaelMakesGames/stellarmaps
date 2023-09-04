<script lang="ts">
	import { getToastStore } from '@skeletonlabs/skeleton';
	import { select } from 'd3-selection';
	import { zoom } from 'd3-zoom';
	import {
		symbol,
		symbolCircle,
		symbolCross,
		symbolDiamond,
		symbolSquare,
		symbolStar,
		symbolTriangle,
		symbolWye,
		type SymbolType,
	} from 'd3-shape';
	import { writable } from 'svelte/store';
	import { fade } from 'svelte/transition';
	import { gameStatePromise } from './GameState';
	import { lastProcessedMapSettings, mapSettings, reprocessMap } from './mapSettings';
	import processMapData from './processMapData';
	import { loadColors } from './tauriCommands';
	import { getLuminance, getLuminanceContrast, toastError } from './utils';

	$: mapDataPromise =
		$gameStatePromise?.then((gs) => processMapData(gs, $lastProcessedMapSettings)) ??
		new Promise<Awaited<ReturnType<typeof processMapData>>>(() => {});

	const toastStore = getToastStore();
	let colorsPromise = loadColors().catch(
		toastError({
			title: 'Failed to load Stellaris colors',
			defaultValue: {} as Record<string, string>,
			toastStore,
		}),
	);

	function resolveColor(
		colors: Record<string, string>,
		countryColors: { primaryColor: string; secondaryColor: string },
		colorSetting: string,
		backgroundColorSetting?: string,
		minimumContrast?: number,
	): string {
		let value = colorSetting;
		if (colorSetting === 'primary') value = countryColors.primaryColor;
		if (colorSetting === 'secondary') value = countryColors.secondaryColor;
		value = colors[value];
		if (!(backgroundColorSetting && minimumContrast)) {
			return value;
		} else {
			const backgroundColor = resolveColor(colors, countryColors, backgroundColorSetting);
			if (getLuminanceContrast(value, backgroundColor) < minimumContrast) {
				return colors[getLuminance(backgroundColor) > 0.5 ? 'fallback_dark' : 'fallback_light'];
			} else {
				return value;
			}
		}
	}

	const debug = writable(false);
	(window as any).debug = debug;

	let svg: null | Element = null;
	let g: null | SVGGElement = null;
	let zoomed = false;
	const zoomHandler = zoom().on('zoom', ({ transform }) => {
		zoomed = true;
		if (g) g.setAttribute('transform', transform);
	});
	$: if (svg) {
		zoomed = false;
		select(svg).call(zoomHandler);
	}

	const symbols: Record<string, SymbolType> = {
		circle: symbolCircle,
		cross: symbolCross,
		diamond: symbolDiamond,
		square: symbolSquare,
		star: symbolStar,
		triangle: symbolTriangle,
		wye: symbolWye,
	};
	$: countryCapitalIconPath =
		$mapSettings.countryCapitalIcon !== 'none'
			? symbol(symbols[$mapSettings.countryCapitalIcon], $mapSettings.countryCapitalIconSize)()
			: '';
	$: sectorCapitalIconPath =
		$mapSettings.sectorCapitalIcon !== 'none'
			? symbol(symbols[$mapSettings.sectorCapitalIcon], $mapSettings.sectorCapitalIconSize)()
			: '';
	$: populatedSystemIconPath =
		$mapSettings.populatedSystemIcon !== 'none'
			? symbol(symbols[$mapSettings.populatedSystemIcon], $mapSettings.populatedSystemIconSize)()
			: '';
	$: unpopulatedSystemIconPath =
		$mapSettings.unpopulatedSystemIcon !== 'none'
			? symbol(
					symbols[$mapSettings.unpopulatedSystemIcon],
					$mapSettings.unpopulatedSystemIconSize,
			  )()
			: '';
</script>

<div class="w-full h-full relative" style:background="#111">
	{#if zoomed}
		<button
			type="button"
			class="btn-icon variant-filled absolute top-3 left-3"
			transition:fade
			on:click={reprocessMap}
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
			<svg
				viewBox="-500 -500 1000 1000"
				class="w-full h-full"
				style="background: #111; text-shadow: 0px 0px 3px black;"
				bind:this={svg}
			>
				<defs>
					{#if data}
						{#each data.borders as border}
							<clipPath id="border-{border.countryId}-inner-clip-path">
								<use href="#border-{border.countryId}-inner" />
							</clipPath>
						{/each}
					{/if}
				</defs>
				<g bind:this={g}>
					{#if data}
						{#each data.borders as border}
							<path
								id="border-{border.countryId}-outer"
								d={border.outerPath}
								fill={resolveColor(colors, border, $mapSettings.borderColor)}
							/>
							<path
								id="border-{border.countryId}-inner"
								d={border.innerPath}
								fill={resolveColor(colors, border, $mapSettings.borderFillColor)}
							/>
							{#if $mapSettings.sectorBorders}
								{#each border.sectorBorders as sectorBorder}
									<path
										d={sectorBorder}
										stroke-width={$mapSettings.sectorBorderWidth}
										clip-path={resolveColor(colors, border, $mapSettings.borderFillColor) ===
										resolveColor(colors, border, $mapSettings.borderColor)
											? ''
											: `url(#border-${border.countryId}-inner-clip-path)`}
										stroke={resolveColor(
											colors,
											border,
											$mapSettings.sectorBorderColor,
											$mapSettings.borderFillColor,
											$mapSettings.sectorBorderMinContrast,
										)}
										fill="none"
										stroke-dasharray={$mapSettings.sectorBorderDashArray}
									/>
								{/each}
							{/if}
						{/each}
						<path
							d={data.hyperlanesPath}
							stroke="white"
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width={$mapSettings.hyperlaneWidth}
							opacity={$mapSettings.hyperlaneOpacity}
						/>
						<path
							d={data.relayHyperlanesPath}
							stroke="white"
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width={$mapSettings.hyperRelayWidth}
							opacity={$mapSettings.hyperRelayOpacity}
						/>
						{#each data.systems as system}
							{#if system.isCountryCapital && $mapSettings.countryCapitalIcon !== 'none'}
								<path
									transform="translate({system.x},{system.y})"
									d={countryCapitalIconPath}
									fill={resolveColor(
										colors,
										system,
										$mapSettings.populatedSystemIconColor,
										$mapSettings.borderFillColor,
										$mapSettings.populatedSystemIconMinContrast,
									)}
								/>
							{:else if system.isSectorCapital && $mapSettings.sectorCapitalIcon !== 'none'}
								<path
									transform="translate({system.x},{system.y})"
									d={sectorCapitalIconPath}
									fill={resolveColor(
										colors,
										system,
										$mapSettings.populatedSystemIconColor,
										$mapSettings.borderFillColor,
										$mapSettings.populatedSystemIconMinContrast,
									)}
								/>
							{:else if system.isColonized && $mapSettings.populatedSystemIcon !== 'none'}
								<path
									transform="translate({system.x},{system.y})"
									d={populatedSystemIconPath}
									fill={resolveColor(
										colors,
										system,
										$mapSettings.populatedSystemIconColor,
										$mapSettings.borderFillColor,
										$mapSettings.populatedSystemIconMinContrast,
									)}
								/>
							{:else if $mapSettings.unpopulatedSystemIcon !== 'none'}
								<path
									transform="translate({system.x},{system.y})"
									d={unpopulatedSystemIconPath}
									fill="white"
								/>
							{/if}
						{/each}
						{#each data.borders as border}
							{#each border.labelPoints as { point, emblemWidth, emblemHeight, textWidth, textHeight }}
								{#if $debug}<circle cx={point[0]} cy={point[1]} r={3} fill="#F0F" />{/if}
								{#if $debug && emblemWidth && emblemHeight}
									<rect
										stroke-width={1}
										stroke="#F0F"
										x={point[0] - emblemWidth / 2}
										y={point[1] - (textHeight ? emblemHeight : emblemHeight / 2)}
										width={emblemWidth}
										height={emblemHeight}
										fill="transparent"
									/>
								{/if}
								{#if emblemWidth && emblemHeight && border.emblemKey && data.emblems[border.emblemKey]}
									<image
										x={point[0] - emblemWidth / 2}
										y={point[1] - (textHeight ? emblemHeight : emblemHeight / 2)}
										width={emblemWidth}
										height={emblemHeight}
										href={data.emblems[border.emblemKey]}
									/>
									<!-- This lets the user right-click "Copy Image" to paste into an external program -->
									<foreignObject
										x={point[0] - emblemWidth / 2}
										y={point[1] - (textHeight ? emblemHeight : emblemHeight / 2)}
										width={emblemWidth}
										height={emblemHeight}
										href={data.emblems[border.emblemKey]}
										opacity="0"
									>
										<img
											width={emblemWidth}
											height={emblemHeight}
											src={data.emblems[border.emblemKey]}
											alt="Country Emblem"
										/>
									</foreignObject>
								{/if}
								{#if $debug && textWidth && textHeight}
									<rect
										stroke-width={1}
										stroke="#F0F"
										x={point[0] - textWidth / 2}
										y={point[1] - (emblemHeight ? 0 : textHeight / 2)}
										width={textWidth}
										height={textHeight}
										fill="transparent"
									/>
								{/if}
								{#if textWidth && textHeight && border.name}
									<text
										stroke-width={1}
										x={point[0]}
										y={point[1] + (emblemHeight ? textHeight / 2 : 0)}
										text-anchor="middle"
										dominant-baseline="middle"
										font-size={textHeight}
										fill="white"
										font-family={$lastProcessedMapSettings.countryNamesFont}
										textLength={textWidth}
										lengthAdjust="spacingAndGlyphs"
									>
										{border.name}
									</text>
								{/if}
							{/each}
						{/each}
					{/if}
				</g>
			</svg>
		{/await}
	{/if}
</div>
