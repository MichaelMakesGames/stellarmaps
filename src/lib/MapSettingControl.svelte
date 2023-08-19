<script lang="ts">
	import { get } from 'svelte/store';
	import { mapSettings, type MapSettingConfig } from './mapSettings';
	import { RangeSlider, SlideToggle } from '@skeletonlabs/skeleton';
	import ReprocessMapBadge from './ReprocessMapBadge.svelte';

	export let config: MapSettingConfig;

	let values = get(mapSettings);
	let value: any = values[config.id];
	$: {
		mapSettings.update((prev) => ({
			...prev,
			[config.id]: value
		}));
	}
</script>

<label class="label" for={config.id}>
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
			bind:value
			min={config.min}
			max={config.max}
			step={config.step}
		/>
	{:else if config.type === 'range'}
		<RangeSlider name={config.id} bind:value min={config.min} max={config.max} step={config.step} />
	{:else if config.type === 'select'}
		<select class="select" bind:value>
			{#each config.options as option (option.id)}
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
