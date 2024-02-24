<script lang="ts">
	import { RangeSlider, SlideToggle, popup } from '@skeletonlabs/skeleton';
	import { onDestroy } from 'svelte';
	import type { FormEventHandler } from 'svelte/elements';
	import { get, type Readable } from 'svelte/store';
	import { slide } from 'svelte/transition';
	import ColorSettingControl from './ColorSettingControl.svelte';
	import IconSettingControl from './IconSettingControl.svelte';
	import StrokeSettingControl from './StrokeSettingControl.svelte';
	import HeroiconInfoMini from './icons/HeroiconInfoMini.svelte';
	import {
		editedMapSettings,
		emptyOptions,
		validateSetting,
		type MapSettingConfig,
		type SelectOption,
	} from './mapSettings';
	import { isDefined } from './utils';

	export let config: MapSettingConfig;

	let value: any = get(editedMapSettings)[config.id];
	let unsubscribe = editedMapSettings.subscribe((values) => {
		value = values[config.id];
	});
	$: {
		if (value !== $editedMapSettings[config.id]) {
			editedMapSettings.update((prev) => ({
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

	$: hidden = config.hideIf?.($editedMapSettings);

	const dynamicOptions: Readable<SelectOption[]> =
		config.type === 'select' && config.dynamicOptions ? config.dynamicOptions : emptyOptions;

	$: options = config.type === 'select' ? [...config.options, ...$dynamicOptions] : [];
	$: groups = Array.from(new Set(options.map((option) => option.group).filter(isDefined)));

	function handleStrokeToggle(e: Event) {
		value = { ...value, enabled: (e.currentTarget as HTMLInputElement).checked };
	}

	$: [valid, invalidMessage] = validateSetting(value, config);

	onDestroy(() => {
		unsubscribe();
	});
</script>

{#if !hidden}
	<label class="label" for={config.id} transition:slide>
		<div class="flex items-center">
			{config.name}
			{#if config.tooltip}
				<button
					type="button"
					class="text-secondary-500-400-token ms-1 [&>*]:pointer-events-none"
					use:popup={{ event: 'hover', target: `${config.id}-tooltip`, placement: 'top' }}
				>
					<HeroiconInfoMini />
				</button>
				<div
					class="card variant-filled-secondary z-10 max-w-96 p-2 text-sm"
					data-popup="{config.id}-tooltip"
				>
					{@html config.tooltip}
					<div class="variant-filled-secondary arrow" />
				</div>
			{/if}
			<div class="grow" />
			{#if config.type === 'stroke' || config.type === 'icon'}
				<div class="relative top-1 inline-block">
					<SlideToggle
						name={config.id}
						checked={value.enabled}
						size="sm"
						active="variant-filled-primary"
						label="Enabled"
						on:change={handleStrokeToggle}
					/>
				</div>
			{/if}
		</div>
		{#if config.type === 'number'}
			<input
				class="input"
				class:input-error={!valid}
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
		{:else if config.type === 'stroke'}
			<StrokeSettingControl bind:value {config} />
		{:else if config.type === 'icon'}
			<IconSettingControl bind:value {config} />
		{:else}
			<span>WARNING: unimplemented control</span>
		{/if}
		{#if !valid && invalidMessage}
			<span class="text-error-300">{invalidMessage}</span>
		{/if}
	</label>
{/if}
