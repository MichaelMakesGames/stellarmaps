<script lang="ts">
	import { loadColors } from './tauriCommands';
	import processMapData from './processMapData';
	import { gameStatePromise, type GameState } from './GameState';
	import { lastProcessedMapSettings, mapSettings } from './mapSettings';
	import { getToastStore } from '@skeletonlabs/skeleton';
	import { toastError } from './utils';

	$: mapDataPromise =
		$gameStatePromise?.then((gs) => processMapData(gs, $lastProcessedMapSettings)) ??
		new Promise<ReturnType<typeof processMapData>>(() => {});

	const toastStore = getToastStore();
	let colorsPromise = loadColors().catch(
		toastError({
			title: 'Failed to load Stellaris colors',
			defaultValue: {} as Record<string, string>,
			toastStore,
		}),
	);

	function getBorderColor(
		border: ReturnType<typeof processMapData>['borders'][number],
		setting: string,
	): string {
		if (setting === 'primary') return border.primaryColor;
		if (setting === 'secondary') return border.secondaryColor;
		return setting;
	}
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
			<svg viewBox="-500 -500 1000 1000" width={800} height={800} class="w-full h-full">
				<rect x={-500} y={-500} width={1000} height={1000} fill="#111" />
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
