<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { fly } from 'svelte/transition';
	import HeroiconTrashMini from './icons/HeroiconTrashMini.svelte';
	import {
		COLOR_SETTING_ADJUSTMENT_TYPES,
		type ColorSettingAdjustment,
		type ColorSettingAdjustmentType,
		type MapSettingConfigColor,
	} from './mapSettings';

	export let adjustment: ColorSettingAdjustment;
	export let config: MapSettingConfigColor;

	const dispatch = createEventDispatcher<{
		typeChange: ColorSettingAdjustment['type'];
		valueChange: number;
		delete: void;
	}>();

	function onTypeChange(e: Event & { currentTarget: EventTarget & HTMLSelectElement }) {
		dispatch('typeChange', e.currentTarget.value as ColorSettingAdjustment['type']);
	}

	const ADJUSTMENT_NAMES: Record<ColorSettingAdjustmentType, string> = {
		LIGHTEN: 'Lighten',
		DARKEN: 'Darken',
		MIN_LIGHTNESS: 'Min Lightness',
		MAX_LIGHTNESS: 'Max Lightness',
		MIN_CONTRAST: 'Min Contrast',
		OPACITY: 'Opacity',
	};
</script>

<div class="flex space-x-2" transition:fly>
	<select class="select w-1/2 p-1 text-sm" value={adjustment.type ?? ''} on:change={onTypeChange}>
		<option value="">Select type...</option>
		{#each COLOR_SETTING_ADJUSTMENT_TYPES.filter((t) => !config.allowedAdjustments || config.allowedAdjustments.includes(t)) as type}
			<option value={type}>{ADJUSTMENT_NAMES[type]}</option>
		{/each}
	</select>
	<input
		type="range"
		class="input w-1/2"
		min="0"
		max="1"
		step="0.05"
		value={adjustment.value}
		on:input={(e) => dispatch('valueChange', parseFloat(e.currentTarget.value))}
	/>
	<button type="button" class="text-error-400" on:click={() => dispatch('delete')}>
		<HeroiconTrashMini />
	</button>
</div>
