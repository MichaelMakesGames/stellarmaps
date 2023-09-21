<script lang="ts">
	import { Accordion, AccordionItem, getModalStore, getToastStore } from '@skeletonlabs/skeleton';
	import MapSettingControl from './MapSettingControl.svelte';
	import { gameStatePromise } from './GameState';
	import {
		lastProcessedMapSettings,
		mapSettingConfig,
		mapSettings,
		reprocessMap,
	} from './mapSettings';
	import parseSave from './parseSave';
	import ReprocessMapBadge from './ReprocessMapBadge.svelte';
	import ReprocessButton from './ReprocessButton.svelte';
	import { loadSave, loadSaveMetadata, type StellarisSaveMetadata } from './tauriCommands';
	import { toastError, wait } from './utils';

	let selectedSaveGroup: StellarisSaveMetadata[] | null = null;
	let selectedSave: StellarisSaveMetadata | null = null;
	$: if (
		selectedSaveGroup != null &&
		(selectedSave == null || !selectedSaveGroup.includes(selectedSave))
	) {
		selectedSave = selectedSaveGroup[0];
	}
	let loadedSave: StellarisSaveMetadata | null = null;

	const toastStore = getToastStore();
	function loadSaves() {
		return loadSaveMetadata().catch(
			toastError({
				title: 'Failed to load Stellaris saves',
				defaultValue: [] as StellarisSaveMetadata[][],
				toastStore,
			}),
		);
	}
	let savesPromise = loadSaves();
	function refreshSaves() {
		selectedSaveGroup = null;
		selectedSave = null;
		savesPromise = loadSaves();
	}
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

				// update settings that depend on save-specific options
				mapSettings.update((prev) => ({
					...prev,
					terraIncognitaPerspectiveCountry: 'player',
				}));
				lastProcessedMapSettings.update((prev) => ({
					...prev,
					terraIncognitaPerspectiveCountry: 'player',
				}));

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
			<button type="button" class="anchor text-sm !text-surface-300" on:click={refreshSaves}>
				Refresh Save List
			</button>
		</div>
		<select class="select mb-1" bind:value={selectedSaveGroup}>
			{#if selectedSaveGroup == null}
				<option value={null} disabled>Select a save...</option>
			{/if}
			{#await savesPromise then saves}
				{#each saves as saveGroup}
					<option value={saveGroup}>{saveGroup[0].name}</option>
				{/each}
			{/await}
		</select>
		<select class="select mb-1" bind:value={selectedSave} disabled={selectedSaveGroup == null}>
			{#if selectedSave == null}
				<option value={null} disabled hidden />
			{/if}
			{#await savesPromise then saves}
				{#if selectedSaveGroup}
					{#each selectedSaveGroup as save}
						<option value={save}>
							{save.path.split(/[/\\]/).reverse()[0].split('.sav')[0]}
						</option>
					{/each}
				{/if}
			{/await}
		</select>
		<button
			type="submit"
			class="btn variant-filled-primary w-full"
			disabled={!selectedSave}
			class:variant-filled-primary={selectedSave && selectedSave !== loadedSave}
			class:variant-filled-surface={!selectedSave || selectedSave === loadedSave}
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
