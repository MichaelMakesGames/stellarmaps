<script lang="ts">
	import {
		Accordion,
		AccordionItem,
		ListBox,
		ListBoxItem,
		getModalStore,
		getToastStore,
		localStorageStore,
		popup,
	} from '@skeletonlabs/skeleton';
	import MapSettingControl from './MapSettingControl.svelte';
	import { gameStatePromise } from './GameState';
	import {
		lastProcessedMapSettings,
		mapSettingConfig,
		mapSettings,
		presetMapSettings,
		reprocessMap,
		settingsAreDifferent,
		type SavedMapSettings,
	} from './mapSettings';
	import parseSave from './parseSave';
	import ReprocessMapBadge from './ReprocessMapBadge.svelte';
	import ReprocessButton from './ReprocessButton.svelte';
	import { loadSave, loadSaveMetadata, type StellarisSaveMetadata } from './tauriCommands';
	import { toastError, wait } from './utils';
	import HeroiconTrashMini from './icons/HeroiconTrashMini.svelte';

	const modalStore = getModalStore();
	const toastStore = getToastStore();

	let selectedSaveGroup: StellarisSaveMetadata[] | null = null;
	let selectedSave: StellarisSaveMetadata | null = null;
	$: if (
		selectedSaveGroup != null &&
		(selectedSave == null || !selectedSaveGroup.includes(selectedSave))
	) {
		selectedSave = selectedSaveGroup[0];
	}
	let loadedSave: StellarisSaveMetadata | null = null;

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

	const loadedSettingsKey = localStorageStore('loadedSettingsKey', 'PRESET|Default');
	async function loadSettings(type: 'PRESET' | 'CUSTOM', savedSettings: SavedMapSettings) {
		const loadedSettingsName = $loadedSettingsKey.substring($loadedSettingsKey.indexOf('|') + 1);
		const loadedSettings = $loadedSettingsKey.startsWith('PRESET')
			? presetMapSettings.find((preset) => preset.name === loadedSettingsName)
			: $customSavedSettings.find((saved) => saved.name === loadedSettingsName);
		let confirmed = true;
		if (!loadedSettings || settingsAreDifferent(loadedSettings.settings, $mapSettings)) {
			confirmed = await new Promise<boolean>((resolve) => {
				modalStore.trigger({
					type: 'confirm',
					title: 'Are you sure?',
					body: 'Your unsaved changes will be lost.',
					response: resolve,
				});
			});
		}
		if (confirmed) {
			loadedSettingsKey.set(`${type}|${savedSettings.name}`);
			if (settingsAreDifferent(savedSettings.settings, $mapSettings)) {
				await wait(100);
				mapSettings.set(savedSettings.settings);
				lastProcessedMapSettings.set(savedSettings.settings);
			}
		}
	}

	const customSavedSettings = localStorageStore<SavedMapSettings[]>('customSavedSettings', []);
	function saveSettings() {
		modalStore.trigger({
			type: 'prompt',
			title: 'Enter a name',
			value: $loadedSettingsKey.substring($loadedSettingsKey.indexOf('|') + 1),
			response: (response) => {
				if (typeof response === 'string') {
					customSavedSettings.update((prev) =>
						prev
							.filter((saved) => saved.name !== response)
							.concat([
								{
									name: response,
									settings: $mapSettings,
								},
							])
							.sort((a, b) => a.name.toLocaleLowerCase().localeCompare(b.name.toLocaleLowerCase())),
					);
					loadedSettingsKey.set(`CUSTOM|${response}`);
					toastStore.trigger({
						message: `"${response}" settings saved`,
						background: 'variant-filled-success',
					});
				}
			},
		});
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
				const promise = wait(100)
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
			<button type="button" class="text-sm text-surface-300" on:click={refreshSaves}>
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
			<!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->
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

	<div class="flex items-baseline p-4 pb-1" style="transition-duration: 50ms;">
		<h2 class="h3 flex-1">Map Settings</h2>
		<button type="button" class="text-primary-500 mx-2" on:click={saveSettings}>Save</button>
		<button
			type="button"
			class="text-primary-500"
			use:popup={{
				event: 'focus-click',
				target: 'popupCombobox',
				placement: 'bottom',
				closeQuery: '.listbox-item',
			}}
		>
			Load
		</button>
		<div class="card w-64 shadow-xl py-2 z-10" data-popup="popupCombobox">
			<ListBox rounded="rounded-none" active="variant-filled-primary">
				{#if $customSavedSettings.length > 0}
					<div class="text-secondary-300 px-4 pt-2" style="font-variant-caps: small-caps;">
						Custom
					</div>
					{#each $customSavedSettings as saved}
						<ListBoxItem
							group={$loadedSettingsKey}
							name="loadSettings"
							value="CUSTOM|{saved.name}"
							on:click={() => loadSettings('CUSTOM', saved)}
						>
							{saved.name}
							<svelte:fragment slot="trail">
								<button
									type="button"
									class="text-error-400 hover:text-error-300 focus:text-error-300 relative top-1"
									on:click={() => {
										modalStore.trigger({
											type: 'confirm',
											title: 'Are you sure?',
											body: `You are about to delete "${saved.name}". This cannot be undone.`,
											buttonTextConfirm: 'Delete',
											response: (response) => {
												if (response) {
													customSavedSettings.update((prev) =>
														prev.filter((other) => !(other.name === saved.name)),
													);
												}
											},
										});
									}}
								>
									<HeroiconTrashMini class="w-4 h-4" />
								</button>
							</svelte:fragment>
						</ListBoxItem>
					{/each}
				{/if}
				<div class="text-secondary-300 px-4 pt-2" style="font-variant-caps: small-caps;">
					Presets
				</div>
				{#each presetMapSettings as preset}
					<ListBoxItem
						group={$loadedSettingsKey}
						name="loadSettings"
						value="PRESET|{preset.name}"
						on:click={() => loadSettings('PRESET', preset)}
					>
						{preset.name}
					</ListBoxItem>
				{/each}
			</ListBox>
			<div class="arrow bg-surface-100-800-token" />
		</div>
	</div>

	<div class="px-4 pb-2 flex align-middle text-sm">
		<ReprocessMapBadge />
		<span class="ms-1">= requires reprocessing</span>
	</div>
	<div class="flex-shrink flex-grow overflow-y-auto">
		<Accordion>
			{#each mapSettingConfig as settingGroup (settingGroup.id)}
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
