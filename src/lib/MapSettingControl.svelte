<script lang="ts">
	import { get, readable, type Readable } from 'svelte/store';
	import {
		mapSettings,
		type MapSettingConfig,
		type SelectOption,
		colorDynamicOptions,
		emptyOptions,
		colorOptions,
	} from './mapSettings';
	import {
		Accordion,
		AccordionItem,
		popup,
		RangeSlider,
		SlideToggle,
	} from '@skeletonlabs/skeleton';
	import ReprocessMapBadge from './ReprocessMapBadge.svelte';
	import type { FormEventHandler } from 'svelte/elements';
	import { slide } from 'svelte/transition';
	import { isDefined } from './utils';
	import ColorSettingControl from './ColorSettingControl.svelte';

	export let config: MapSettingConfig;

	let value: any = get(mapSettings)[config.id];
	mapSettings.subscribe((values) => {
		value = values[config.id];
	});
	$: {
		if (value !== $mapSettings[config.id]) {
			mapSettings.update((prev) => ({
				...prev,
				[config.id]: value,
			}));
		}
	}

	const handleNumberInput: FormEventHandler<HTMLInputElement> = (e) => {
		const newValue = parseFloat(e.currentTarget.value);
		if (Number.isFinite(newValue)) {
			value = newValue;
		} else if (config.type === 'number' && config.optional) {
			value = null;
		}
	};

	$: hidden = false; // config.hideIf?.($mapSettings);

	const dynamicOptions: Readable<SelectOption[]> =
		config.type === 'select' && config.dynamicOptions ? config.dynamicOptions : emptyOptions;

	$: options = config.type === 'select' ? [...config.options, ...$dynamicOptions] : [];
	$: groups = Array.from(new Set(options.map((option) => option.group).filter(isDefined)));
</script>

{#if !hidden}
	<label class="label" for={config.id} transition:slide>
		<span>
			{config.name}
			{#if config.requiresReprocessing}
				<span class="relative top-1">
					<ReprocessMapBadge />
				</span>
			{/if}
		</span>
		{#if config.type === 'number'}
			<input
				class="input"
				type="number"
				value={value ?? ''}
				on:input={handleNumberInput}
				min={config.min}
				max={config.max}
				step={config.step}
			/>
		{:else if config.type === 'range'}
			<RangeSlider
				name={config.id}
				bind:value
				min={config.min}
				max={config.max}
				step={config.step}
			/>
		{:else if config.type === 'text'}
			<input class="input" type="text" bind:value />
		{:else if config.type === 'select'}
			<select class="select" bind:value>
				{#each options.filter((opt) => opt.group == null) as option (option.id)}
					<option value={option.id}>{option.name}</option>
				{/each}
				{#each groups as group}
					<optgroup label={group}>
						{#each options.filter((opt) => opt.group === group) as option (option.id)}
							<option value={option.id}>{option.name}</option>
						{/each}
					</optgroup>
				{/each}
			</select>
		{:else if config.type === 'toggle'}
			<div>
				<SlideToggle name={config.id} bind:checked={value} active="bg-primary-500">
					{value ? 'Enabled' : 'Disabled'}
				</SlideToggle>
			</div>
		{:else if config.type === 'color'}
			<ColorSettingControl bind:value {config} />
		{:else}
			<span>TODO</span>
		{/if}
	</label>
{/if}
