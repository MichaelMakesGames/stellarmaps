<script lang="ts">
	import { loadColors } from './tauriCommands';
	import processMapData from './processMapData';
	import { gameStatePromise, type GameState } from './GameState';
	import { lastProcessedMapSettings, mapSettings } from './mapSettings';
	import { getToastStore } from '@skeletonlabs/skeleton';
	import { toastError } from './utils';
	import { writable } from 'svelte/store';

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

	function getBorderColor(
		border: Awaited<ReturnType<typeof processMapData>>['borders'][number],
		setting: string,
	): string {
		if (setting === 'primary') return border.primaryColor;
		if (setting === 'secondary') return border.secondaryColor;
		return setting;
	}

	const debug = writable(false);
	(window as any).debug = debug;
</script>

<div class="w-full h-full" style:background="#111">
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
			>
				{#if data}
					{#each data.borders as border}
						<path
							d={border.outerPath}
							fill={colors[getBorderColor(border, $mapSettings.borderColor)]}
						/>
						<path
							d={border.innerPath}
							fill={colors[getBorderColor(border, $mapSettings.borderFillColor)]}
						/>
					{/each}
					<path
						d={data.hyperlanesPath}
						stroke="white"
						stroke-width={$mapSettings.hyperlaneWidth}
						opacity={$mapSettings.hyperlaneOpacity}
					/>
					<path
						d={data.relayHyperlanesPath}
						stroke="white"
						stroke-width={$mapSettings.hyperRelayWidth}
						opacity={$mapSettings.hyperRelayOpacity}
					/>
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
								>
									{border.name}
								</text>
							{/if}
						{/each}
					{/each}
				{/if}
				{#each Object.values(gameState.galactic_object) as galacticObject}
					<circle
						cx={-galacticObject.coordinate.x}
						cy={galacticObject.coordinate.y}
						r={1}
						fill="#FFF"
					/>
				{/each}
			</svg>
		{/await}
	{/if}
</div>
