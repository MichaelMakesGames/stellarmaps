<script lang="ts">
	import { type } from '@tauri-apps/api/os';
	import { join, documentDir, localDataDir, homeDir } from '@tauri-apps/api/path';
	import { BlobReader, ZipReader, type Entry, TextWriter } from '@zip.js/zip.js';
	import { Delaunay } from 'd3-delaunay';
	import type { Country, GameState } from './GameState';
	import parseSave from './parseSave';
	import processMapData from './processMapData';

	const osTypePromise = type();
	const stellarisUserDataPromise = osTypePromise.then(async (osType) => {
		return join(
			osType === 'Linux' ? await localDataDir() : await documentDir(),
			'Paradox Interative',
			'Stellaris'
		);
	});
	const stellarisInstallPromise = osTypePromise.then(async (osType) => {
		// default location is outside of dirs Tauri can access; will need to write own Rust code
		if (osType !== 'Linux') throw new Error(`${osType} unsupported`);
		return join(await homeDir(), '.steam', 'root', 'steamapps', 'common', 'Stellaris');
	});

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
</script>

<div>
	OS:
	{#await osTypePromise}
		<span>...</span>
	{:then osType}
		<span>{osType}</span>
	{/await}
</div>

<div>
	Stellaris Data:
	{#await stellarisUserDataPromise}
		<span>...</span>
	{:then stellarisUserData}
		<span>{stellarisUserData}</span>
	{/await}
</div>

<div>
	Stellaris Install:
	{#await stellarisInstallPromise}
		<span>...</span>
	{:then stellarisInstall}
		<span>{stellarisInstall}</span>
	{/await}
</div>

<div>
	<input type="file" accept=".sav" bind:files on:change={parse} />
</div>

{#if gameState}
	<svg viewBox="-500 -500 1000 1000" width={500} height={500}>
		<rect x={-500} y={-500} width={1000} height={1000} fill="#111" />
		{#if data}
			{#each data.systems as system}
				<path d={system.path} fill={system.color} />
			{/each}
		{/if}
		{#each Object.values(gameState.galactic_object) as galacticObject}
			<circle cx={galacticObject.coordinate.x} cy={galacticObject.coordinate.y} r={1} fill="#FFF" />
		{/each}
	</svg>
{/if}
