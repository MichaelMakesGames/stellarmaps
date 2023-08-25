<script lang="ts">
	import { get } from 'svelte/store';
	import { mapSettings, type MapSettingConfig, type IdAndName } from './mapSettings';
	import { RangeSlider, SlideToggle } from '@skeletonlabs/skeleton';
	import ReprocessMapBadge from './ReprocessMapBadge.svelte';
	import type { FormEventHandler } from 'svelte/elements';
	import { slide } from 'svelte/transition';
	import { onDestroy } from 'svelte';

	export let config: MapSettingConfig;

	let values = get(mapSettings);
	let value: any = values[config.id];
	$: {
		mapSettings.update((prev) => ({
			...prev,
			[config.id]: value,
		}));
	}

	const handleNumberInput: FormEventHandler<HTMLInputElement> = (e) => {
		const newValue = parseFloat((e.target as HTMLInputElement).value);
		console.warn(newValue);
		if (Number.isFinite(newValue)) {
			value = newValue;
		} else if (config.type === 'number' && config.optional) {
			value = null;
		}
	};

	$: hidden = config.hideIf?.($mapSettings);

	let dynamicOptions: IdAndName[] = [];
	if (config.type === 'select' && config.dynamicOptions) {
		const unsubscribe = config.dynamicOptions.subscribe((options) => {
			dynamicOptions = options;
		});
		onDestroy(unsubscribe);
	}
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
		{:else if config.type === 'select'}
			<select class="select" bind:value>
				{#each config.options as option (option.id)}
					<option value={option.id}>{option.name}</option>
				{/each}
				{#each dynamicOptions as option (option.id)}
					<option value={option.id}>{option.name}</option>
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
