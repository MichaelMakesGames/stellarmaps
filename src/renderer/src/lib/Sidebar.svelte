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
	import ApplyChangesButton from './ApplyChangesButton.svelte';
	import { gameStatePromise, gameStateSchema } from './GameState';
	import MapSettingControl from './MapSettingControl.svelte';
	import debug from './debug';
	import HeroiconTrashMini from './icons/HeroiconTrashMini.svelte';
	import { localizeText } from './map/data/locUtils';
	import {
		applyMapSettings,
		countryOptions,
		editedMapSettings,
		lastProcessedMapSettings,
		mapSettingConfig,
		mapSettings,
		presetMapSettings,
		settingsAreDifferent,
		validateAndResetSettings,
		type SavedMapSettings,
	} from './mapSettings';
	import stellarMapsApi, { type StellarisSaveMetadata } from './stellarMapsApi';
	import { saveToWindow, timeIt, timeItAsync, toastError, wait } from './utils';

	const modalStore = getModalStore();
	const toastStore = getToastStore();

	let selectedSaveGroup: [StellarisSaveMetadata, ...StellarisSaveMetadata[]] | null = null;
	let selectedSave: StellarisSaveMetadata | null = null;
	$: if (
		selectedSaveGroup != null &&
		(selectedSave == null || !selectedSaveGroup.includes(selectedSave))
	) {
		selectedSave = selectedSaveGroup[0];
	}
	let loadedSave: StellarisSaveMetadata | null = null;

	function loadSaves() {
		return stellarMapsApi.loadSaveMetadata().catch(
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
		if (!loadedSettings || settingsAreDifferent(loadedSettings.settings, $editedMapSettings)) {
			confirmed = await new Promise<boolean>((resolve) => {
				modalStore.trigger({
					type: 'confirm',
					title: 'Are you sure?',
					body: 'You have customized your map setting that you have not saved. These changes will be lost.',
					response: resolve,
				});
			});
		}
		if (confirmed) {
			loadedSettingsKey.set(`${type}|${savedSettings.name}`);
			if (settingsAreDifferent(savedSettings.settings, $mapSettings)) {
				const validated = validateAndResetSettings(savedSettings.settings);
				editedMapSettings.set(validated);
				mapSettings.set(validated);
				lastProcessedMapSettings.set(validated);
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
	class="flex h-full w-96 flex-col"
	on:submit|preventDefault={applyMapSettings}
	novalidate
>
	<form
		class="p-4"
		on:submit|preventDefault={() => {
			loadedSave = selectedSave;
			if (selectedSave) {
				const { path } = selectedSave;
				const promise = wait(100)
					.then(() => timeItAsync('loadSave', stellarMapsApi.loadSave, path))
					.then((unvalidated) =>
						timeIt('validateSave', () => {
							if ($debug) saveToWindow('unvalidatedGameState', unvalidated);
							return gameStateSchema.parse(unvalidated);
						}),
					);
				promise.then(async (gameState) => {
					Promise.all(
						Object.entries(gameState.country)
							.filter(([_id, country]) => country.type === 'default')
							.map(([id, country]) => localizeText(country.name).then((name) => ({ id, name }))),
					).then(countryOptions.set);
				});
				gameStatePromise.set(promise);

				// update settings that depend on save-specific options
				editedMapSettings.update((prev) => ({
					...prev,
					terraIncognitaPerspectiveCountry: 'player',
				}));
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
					<option value={saveGroup}>{saveGroup[0]?.name}</option>
				{/each}
			{/await}
		</select>
		<select class="select mb-1" bind:value={selectedSave} disabled={selectedSaveGroup == null}>
			{#if selectedSave == null}
				<option value={null} disabled hidden />
			{/if}
			{#await savesPromise then _saves}
				{#if selectedSaveGroup}
					{#each selectedSaveGroup as save}
						<option value={save}>
							{save.path.split(/[/\\]/).reverse()[0]?.split('.sav')[0]}
						</option>
					{/each}
				{/if}
			{/await}
		</select>
		<button
			type="submit"
			class="variant-filled-primary btn w-full"
			disabled={!selectedSave}
			class:variant-filled-primary={selectedSave && selectedSave !== loadedSave}
			class:variant-filled-surface={!selectedSave || selectedSave === loadedSave}
		>
			Load Save
		</button>
	</form>

	<div class="flex items-baseline p-4 pb-1" style="transition-duration: 50ms;">
		<h2 class="h3 flex-1">Map Settings</h2>
		<button type="button" class="mx-2 text-primary-500" on:click={saveSettings}>Save</button>
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
		<div class="card z-10 w-64 py-2 shadow-xl" data-popup="popupCombobox">
			<ListBox rounded="rounded-none" active="variant-filled-primary">
				{#if $customSavedSettings.length > 0}
					<div class="px-4 pt-2 text-secondary-300" style="font-variant-caps: small-caps;">
						Custom
					</div>
					{#each $customSavedSettings as saved}
						<ListBoxItem
							group={$loadedSettingsKey}
							name="loadSettings"
							value="CUSTOM|{saved.name}"
							on:click={(e) => {
								e.preventDefault();
								loadSettings('CUSTOM', saved);
							}}
						>
							{saved.name}
							<svelte:fragment slot="trail">
								<button
									type="button"
									class="relative top-1 text-error-400 hover:text-error-300 focus:text-error-300"
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
									<HeroiconTrashMini class="h-4 w-4" />
								</button>
							</svelte:fragment>
						</ListBoxItem>
					{/each}
				{/if}
				<div class="px-4 pt-2 text-secondary-300" style="font-variant-caps: small-caps;">
					Presets
				</div>
				{#each presetMapSettings as preset}
					<ListBoxItem
						group={$loadedSettingsKey}
						name="loadSettings"
						value="PRESET|{preset.name}"
						on:click={(e) => {
							e.preventDefault();
							loadSettings('PRESET', preset);
						}}
					>
						{preset.name}
					</ListBoxItem>
				{/each}
			</ListBox>
			<div class="bg-surface-100-800-token arrow" />
		</div>
	</div>

	<div class="flex-shrink flex-grow overflow-y-auto">
		<Accordion spacing="space-y-2">
			{#each mapSettingConfig as settingGroup (settingGroup.id)}
				<AccordionItem regionPanel="space-y-6">
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
	<ApplyChangesButton />
</form>
