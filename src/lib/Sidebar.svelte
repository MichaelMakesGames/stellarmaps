<script lang="ts">
	import { Accordion, AccordionItem } from '@skeletonlabs/skeleton';
	import MapSettingControl from './MapSettingControl.svelte';
	import { gameState } from './GameState';
	import { mapSettingConfig, reprocessMap } from './mapSettings';
	import parseSave from './parseSave';
	import ReprocessMapBadge from './ReprocessMapBadge.svelte';
	import ReprocessButton from './ReprocessButton.svelte';

	let files: null | FileList = null;

	async function parse() {
		let file = files?.item(0);
		if (!file) return;
		gameState.set(await parseSave(file));
	}
</script>

<form
	id="sidebar-left"
	class="flex flex-col h-full w-96"
	on:submit|preventDefault={reprocessMap}
	novalidate
>
	<div class="form-group p-4">
		<label for="saveFileInput">Save File</label>
		<input
			id="saveFileInput"
			class="input"
			type="file"
			accept=".sav"
			bind:files
			on:change={parse}
		/>
	</div>
	<h2 class="h3 p-4 pb-1">Map Settings</h2>
	<div class="px-4 pb-2 flex align-middle text-sm">
		<ReprocessMapBadge /><span class="ms-1"> = requires reprocessing </span>
	</div>
	<div class="flex-shrink flex-grow overflow-y-auto">
		<Accordion>
			{#each mapSettingConfig as settingGroup, i (settingGroup.id)}
				<AccordionItem>
					<svelte:fragment slot="summary">
						<h3 class="h4 font-bold">
							{settingGroup.name}
						</h3>
					</svelte:fragment>
					<svelte:fragment slot="content">
						{#each settingGroup.settings as config (config.id)}
							<MapSettingControl {config} />
						{/each}
					</svelte:fragment>
				</AccordionItem>
			{/each}
		</Accordion>
	</div>
	<ReprocessButton />
</form>
