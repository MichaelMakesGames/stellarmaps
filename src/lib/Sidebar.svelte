<script lang="ts">
	import { Accordion, AccordionItem, getModalStore, getToastStore } from '@skeletonlabs/skeleton';
	import MapSettingControl from './MapSettingControl.svelte';
	import { gameStatePromise } from './GameState';
	import { mapSettingConfig, reprocessMap } from './mapSettings';
	import parseSave from './parseSave';
	import ReprocessMapBadge from './ReprocessMapBadge.svelte';
	import ReprocessButton from './ReprocessButton.svelte';
	import { loadSave, loadSaveMetadata, type StellarisSaveMetadata } from './tauriCommands';
	import { toastError, wait } from './utils';

	const toastStore = getToastStore();
	const savesPromise = loadSaveMetadata().catch(
		toastError({
			title: 'Failed to load Stellaris saves',
			defaultValue: [] as StellarisSaveMetadata[][],
			toastStore,
		}),
	);
	let selectedSave: StellarisSaveMetadata | null = null;
	let loadedSave: StellarisSaveMetadata | null = null;
</script>

<form
	id="sidebar-left"
	class="flex flex-col h-full w-96"
	on:submit|preventDefault={reprocessMap}
	novalidate
>
	<form
		class="p-4"
		on:submit|preventDefault={() => {
			loadedSave = selectedSave;
			if (selectedSave) {
				const { path } = selectedSave;
				const promise = wait(500)
					.then(() => loadSave(path))
					.then(parseSave);
				gameStatePromise.set(promise);
				promise.catch(
					toastError({
						title: `Failed to load ${selectedSave.path}`,
						defaultValue: null,
						toastStore,
					}),
				);
			}
		}}
	>
		<div class="flex justify-between">
			<h2 class="label">Save Game</h2>
			<small class="text-surface-300">
				{#if selectedSave}
					{selectedSave.name}
				{/if}
			</small>
		</div>
		<select class="select mb-1" bind:value={selectedSave}>
			{#if selectedSave == null}
				<option value={null} disabled hidden />
			{/if}
			{#await savesPromise then saves}
				{#each saves as saveGroup}
					<optgroup label={saveGroup[0].name}>
						{#each saveGroup as save}
							<option value={save}>
								{save.path.split(/[/\\]/).reverse()[0].split('.sav')[0]}
							</option>
						{/each}
					</optgroup>
				{/each}
			{/await}
		</select>
		<button
			type="submit"
			class="btn variant-filled-primary w-full"
			disabled={!selectedSave}
			class:variant-filled-primary={selectedSave !== loadedSave}
			class:variant-filled-surface={selectedSave === loadedSave}
		>
			Load Save
		</button>
	</form>

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
