<script lang="ts">
	import { get } from 'svelte/store';
	import { mapSettings, type MapSettingConfig, type SelectOption } from './mapSettings';
	import { RangeSlider, SlideToggle } from '@skeletonlabs/skeleton';
	import ReprocessMapBadge from './ReprocessMapBadge.svelte';
	import type { FormEventHandler } from 'svelte/elements';
	import { slide } from 'svelte/transition';
	import { onDestroy } from 'svelte';
	import { isDefined } from './utils';

	export let config: MapSettingConfig;

	let value: any = get(mapSettings)[config.id];
	mapSettings.subscribe((values) => {
		value = values[config.id];
	});
	$: {
		mapSettings.update((prev) => ({
			...prev,
			[config.id]: value,
		}));
	}

	const handleNumberInput: FormEventHandler<HTMLInputElement> = (e) => {
		const newValue = parseFloat((e.target as HTMLInputElement).value);
		if (Number.isFinite(newValue)) {
			value = newValue;
		} else if (config.type === 'number' && config.optional) {
			value = null;
		}
	};

	$: hidden = config.hideIf?.($mapSettings);

	let dynamicOptions: SelectOption[] = [];
	if (config.type === 'select' && config.dynamicOptions) {
		const unsubscribe = config.dynamicOptions.subscribe((options) => {
			dynamicOptions = options;
		});
		onDestroy(unsubscribe);
	}

	$: options = config.type === 'select' ? [...config.options, ...dynamicOptions] : [];
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
		{:else}
			<span>TODO</span>
		{/if}
	</label>
{/if}
