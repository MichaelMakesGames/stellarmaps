<script lang="ts">
	import type { GameState } from './GameState';
	import loadColors from './loadColors';
	import parseSave from './parseSave';
	import processMapData from './processMapData';

	let files: null | FileList = null;

	let gameState: GameState | null = null;
	let data: ReturnType<typeof processMapData> | null = null;
	async function parse() {
		let file = files?.item(0);
		if (!file) return;
		const state = await parseSave(file);
		gameState = state;
		(window as any).gameState = gameState;
		data = processMapData(state);
	}

	let colorsPromise = loadColors();
</script>

<div>
	<input type="file" accept=".sav" bind:files on:change={parse} />
</div>

{#await colorsPromise then colors}
	{#if gameState}
		<svg viewBox="-500 -500 1000 1000" width={800} height={800}>
			<rect x={-500} y={-500} width={1000} height={1000} fill="#111" />
			{#if data}
				{#each data.borders as border}
					<path d={border.outerPath} fill={colors[border.secondaryColor]} />
					<path d={border.innerPath} fill={colors[border.primaryColor]} />
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
	{/if}
{/await}
