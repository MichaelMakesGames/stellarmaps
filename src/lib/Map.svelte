<script lang="ts">
	import loadColors from './loadColors';
	import processMapData from './processMapData';
	import { gameState } from './GameState';
	import { lastProcessedMapSettings, mapSettings } from './mapSettings';

	let data: ReturnType<typeof processMapData> | null = null;
	$: if ($gameState) {
		data = processMapData($gameState, $lastProcessedMapSettings);
	}

	let colorsPromise = loadColors();

	function getBorderColor(
		border: ReturnType<typeof processMapData>['borders'][number],
		setting: string
	): string {
		if (setting === 'primary') return border.primaryColor;
		if (setting === 'secondary') return border.secondaryColor;
		return setting;
	}
</script>

<div class="w-full h-full" style:background="#111">
	{#await colorsPromise then colors}
		{#if $gameState}
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
				{#each Object.values($gameState.galactic_object) as galacticObject}
					<circle
						cx={-galacticObject.coordinate.x}
						cy={galacticObject.coordinate.y}
						r={1}
						fill="#FFF"
					/>
				{/each}
			</svg>
		{/if}
	{/await}
</div>
