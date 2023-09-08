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
	import { getLuminance, getLuminanceContrast, toastError } from './utils';
	import { loadStellarisData, stellarisDataPromiseStore } from './loadStellarisData';
	import { dialog } from '@tauri-apps/api';

	$: mapDataPromise =
		$gameStatePromise?.then((gs) => processMapData(gs, $lastProcessedMapSettings)) ??
		new Promise<Awaited<ReturnType<typeof processMapData>>>(() => {});

	loadStellarisData();
	const toastStore = getToastStore();
	$: $stellarisDataPromiseStore.catch(
		toastError({
			title: 'Failed to load Stellaris data',
			description:
				'Please try manually selecting your install location. This should be the fold that contains the <pre class="inline">common</pre>, <pre class="inline">flags</pre>, and <pre class="inline">localisation</pre> folders (among others).',
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

	function resolveColor(
		colors: Record<string, string>,
		countryColors: { primaryColor: string; secondaryColor: string },
		colorSetting: string,
		backgroundColorSetting?: string,
		minimumContrast?: number,
	): string {
		let value = colorSetting;
		if (value === 'border') value = $mapSettings.borderColor;
		if (value === 'primary') value = countryColors.primaryColor;
		if (value === 'secondary') value = countryColors.secondaryColor;
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
	$: unionLeaderIconPath =
		$mapSettings.countryCapitalIcon !== 'none' ? symbol(symbols.star, 30)() : '';
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
							<clipPath id="border-{border.countryId}-outer-clip-path">
								<use href="#border-{border.countryId}-outer" />
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
										d={sectorBorder.path}
										stroke-width={sectorBorder.isUnionBorder
											? $mapSettings.unionBorderWidth
											: $mapSettings.sectorBorderWidth}
										clip-path={resolveColor(colors, border, $mapSettings.borderFillColor) ===
										resolveColor(colors, border, $mapSettings.borderColor)
											? `url(#border-${border.countryId}-outer-clip-path)`
											: `url(#border-${border.countryId}-inner-clip-path)`}
										stroke={resolveColor(
											colors,
											border,
											$mapSettings.sectorBorderColor,
											$mapSettings.borderFillColor,
											$mapSettings.sectorBorderMinContrast,
										)}
										stroke-linecap={sectorBorder.isUnionBorder ||
										!$mapSettings.sectorBorderDashArray
											? 'round'
											: null}
										stroke-linejoin={sectorBorder.isUnionBorder ||
										!$mapSettings.sectorBorderDashArray
											? 'round'
											: null}
										fill="none"
										stroke-dasharray={sectorBorder.isUnionBorder
											? ''
											: $mapSettings.sectorBorderDashArray}
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
						{#each data.labels as label}
							{#each label.labelPoints as { point, emblemWidth, emblemHeight, textWidth, textHeight }}
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
								{#if emblemWidth && emblemHeight && label.emblemKey && data.emblems[label.emblemKey]}
									<image
										x={point[0] - emblemWidth / 2}
										y={point[1] - (textHeight ? emblemHeight : emblemHeight / 2)}
										width={emblemWidth}
										height={emblemHeight}
										href={data.emblems[label.emblemKey]}
									/>
									<!-- This lets the user right-click "Copy Image" to paste into an external program -->
									<foreignObject
										x={point[0] - emblemWidth / 2}
										y={point[1] - (textHeight ? emblemHeight : emblemHeight / 2)}
										width={emblemWidth}
										height={emblemHeight}
										href={data.emblems[label.emblemKey]}
										opacity="0"
									>
										<img
											width={emblemWidth}
											height={emblemHeight}
											src={data.emblems[label.emblemKey]}
											alt="Country Emblem"
										/>
									</foreignObject>
									{#if label.isUnionLeader}
										<text
											transform="translate({point[0]},{point[1] -
												(textHeight ? emblemHeight : emblemHeight / 2)})"
											fill="white"
											text-anchor="middle"
											dominant-baseline="bottom"
											font-size={emblemHeight * $mapSettings.unionLeaderSymbolSize}
										>
											{$mapSettings.unionLeaderSymbol}
										</text>
									{/if}
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
								{#if textWidth && textHeight && label.name}
									<text
										x={point[0]}
										y={point[1] + (emblemHeight ? textHeight / 2 : 0)}
										text-anchor="middle"
										dominant-baseline="middle"
										font-size={textHeight}
										fill="white"
										font-family={$lastProcessedMapSettings.countryNamesFont}
										textLength={textWidth}
										lengthAdjust="spacingAndGlyphs"
										text-decoration={label.isUnionLeader && $mapSettings.unionLeaderUnderline
											? 'underline'
											: ''}
									>
										{label.name}
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
