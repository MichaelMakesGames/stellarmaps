<script lang="ts">
	import {
		Accordion,
		AccordionItem,
		getModalStore,
		getToastStore,
		ListBox,
		ListBoxItem,
		localStorageStore,
		popup,
	} from '@skeletonlabs/skeleton';
	import * as dialog from '@tauri-apps/plugin-dialog';

	import { t } from '../intl';
	import ApplyChangesButton from './ApplyChangesButton.svelte';
	import debug from './debug';
	import { gameStatePromise, gameStateSchema } from './GameState';
	import HeroiconTrashMini from './icons/HeroiconTrashMini.svelte';
	import { localizeText } from './map/data/locUtils';
	import SettingControl from './SettingControl/index.svelte';
	import {
		applyMapSettings,
		asUnknownSettingConfig,
		copyGroupSettings,
		countryOptions,
		editedMapSettings,
		lastProcessedMapSettings,
		mapSettings,
		mapSettingsConfig,
		presetMapSettings,
		type SavedMapSettings,
		settingsAreDifferent,
		validateAndResetMapSettings,
	} from './settings';
	import { speciesOptions } from './settings/options/speciesOptions';
	import type { StellarisSaveMetadata } from './stellarMapsApi';
	import stellarMapsApi from './stellarMapsApi';
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
				title: $t('notification.failed_to_load_save_list'),
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

	function manuallySelectSave() {
		dialog
			.open({
				directory: false,
				multiple: false,
				title: $t('prompt.select_save_file'),
				filters: [{ name: $t('prompt.select_save_file_filter_name'), extensions: ['sav'] }],
			})
			.then((path) => {
				if (typeof path === 'string') {
					selectedSaveGroup = null;
					selectedSave = null;
					loadSave(path);
				}
			});
	}

	function loadSave(path: string) {
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
				Object.values(gameState.country)
					.filter((country) => country.type === 'default')
					.map((country) =>
						localizeText(country.name).then((name) => ({
							id: country.id.toString(),
							literalName: name,
						})),
					),
			).then(countryOptions.set);
			const speciesWithPopulation = new Set(
				Object.values(gameState.planets.planet).flatMap((planet) =>
					Object.keys(planet.species_information ?? {}).map((id) => parseInt(id)),
				),
			);
			Promise.all(
				Object.values(gameState.species_db)
					.filter(
						(species) =>
							speciesWithPopulation.has(species.id) &&
							species.base_ref == null &&
							species.name.key !== 'UNKNOWN',
					)
					.map((species) =>
						localizeText(species.name).then((name) => ({
							id: species.id.toString(),
							literalName: name,
						})),
					),
			).then(speciesOptions.set);
		});
		gameStatePromise.set(promise);

		// update settings that depend on save-specific options
		editedMapSettings.update((prev) => ({
			...prev,
			terraIncognitaPerspectiveCountry: 'player',
			mapModePointOfView: 'player',
			mapModeSpecies: 'player',
		}));
		mapSettings.update((prev) => ({
			...prev,
			terraIncognitaPerspectiveCountry: 'player',
			mapModePointOfView: 'player',
			mapModeSpecies: 'player',
		}));
		lastProcessedMapSettings.update((prev) => ({
			...prev,
			terraIncognitaPerspectiveCountry: 'player',
			mapModePointOfView: 'player',
			mapModeSpecies: 'player',
		}));

		promise.catch(
			toastError({
				title: $t('notification.failed_to_load_save_file', { filePath: path }),
				defaultValue: null,
				toastStore,
			}),
		);
	}

	const loadedSettingsKey = localStorageStore('loadedSettingsKey', 'PRESET|Default');
	async function loadSettings(type: 'PRESET' | 'CUSTOM', savedSettings: SavedMapSettings) {
		const loadedSettingsName = $loadedSettingsKey.substring($loadedSettingsKey.indexOf('|') + 1);
		const loadedSettings = $loadedSettingsKey.startsWith('PRESET')
			? presetMapSettings.find((preset) => preset.name === loadedSettingsName)
			: $customSavedSettings.find((saved) => saved.name === loadedSettingsName);
		let confirmed = true;
		if (
			!loadedSettings ||
			settingsAreDifferent(loadedSettings.settings, $editedMapSettings, {
				excludeGroups: ['mapMode'],
			})
		) {
			confirmed = await new Promise<boolean>((resolve) => {
				modalStore.trigger({
					type: 'confirm',
					title: $t('generic.confirmation'),
					body: $t('confirmation.unsaved_setting_profile'),
					response: resolve,
				});
			});
		}
		if (confirmed) {
			loadedSettingsKey.set(`${type}|${savedSettings.name}`);
			if (
				settingsAreDifferent(savedSettings.settings, $mapSettings, { excludeGroups: ['mapMode'] })
			) {
				const validated = validateAndResetMapSettings(
					copyGroupSettings('mapMode', $editedMapSettings, savedSettings.settings),
				);
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
			title: $t('prompt.enter_settings_profile_name'),
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
						message: $t('notification.settings_profile_saved', { name: response }),
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
			if (selectedSave != null) {
				loadSave(selectedSave.path);
			}
		}}
	>
		<div class="flex">
			<h2 class="label flex-1">{$t('side_bar.save_game')}</h2>
			<button type="button" class="text-sm text-surface-300" on:click={manuallySelectSave}>
				{$t('side_bar.select_manually_button')}
			</button>
			<span class="px-2 text-surface-600">|</span>
			<button type="button" class="text-sm text-surface-300" on:click={refreshSaves}>
				{$t('side_bar.refresh_saves_button')}
			</button>
		</div>
		<select class="select mb-1" bind:value={selectedSaveGroup}>
			{#if selectedSaveGroup == null}
				<option value={null} disabled>{$t('side_bar.select_save_placeholder')}</option>
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
			disabled={selectedSave == null}
			class:variant-filled-primary={selectedSave != null && selectedSave !== loadedSave}
			class:variant-filled-surface={selectedSave == null || selectedSave === loadedSave}
		>
			{$t('side_bar.load_save_button')}
		</button>
	</form>

	<div class="flex-column my-3 flex-col space-y-2 px-4">
		{#each mapSettingsConfig[0]?.settings ?? [] as config (config.id)}
			<SettingControl
				config={asUnknownSettingConfig(config)}
				settings={editedMapSettings}
				writeToSettings={[mapSettings, lastProcessedMapSettings]}
			/>
		{/each}
	</div>

	<div class="flex items-baseline p-4 pb-1" style="transition-duration: 50ms;">
		<h2 class="h3 flex-1">{$t('side_bar.map_settings')}</h2>
		<button type="button" class="mx-2 text-primary-500" on:click={saveSettings}>
			{$t('side_bar.save_settings_button')}
		</button>
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
			{$t('side_bar.load_settings_button')}
		</button>
		<div class="card z-10 w-64 py-2 shadow-xl" data-popup="popupCombobox">
			<ListBox rounded="rounded-none" active="variant-filled-primary">
				{#if $customSavedSettings.length > 0}
					<div class="px-4 pt-2 text-secondary-300" style="font-variant-caps: small-caps;">
						{$t('side_bar.custom_setting_profiles')}
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
											title: $t('generic.confirmation'),
											body: $t('confirmation.delete_setting_profile', { name: saved.name }),
											buttonTextConfirm: 'Delete',
											response: (response) => {
												// eslint-disable-next-line @typescript-eslint/strict-boolean-expressions -- this is a boolean, but TS thinks any
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
					{$t('side_bar.preset_setting_profiles')}
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
			{#each mapSettingsConfig.slice(1) as settingGroup (settingGroup.id)}
				<AccordionItem regionPanel="space-y-6">
					<svelte:fragment slot="summary">
						<h3 class="h4 font-bold">
							{$t(settingGroup.name)}
						</h3>
					</svelte:fragment>
					<svelte:fragment slot="content">
						{#each settingGroup.settings as config (config.id)}
							<SettingControl
								config={asUnknownSettingConfig(config)}
								settings={editedMapSettings}
							/>
						{/each}
					</svelte:fragment>
				</AccordionItem>
			{/each}
		</Accordion>
	</div>
	<ApplyChangesButton />
</form>
