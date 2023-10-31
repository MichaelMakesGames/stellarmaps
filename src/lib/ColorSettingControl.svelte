<script lang="ts">
	import { Accordion, AccordionItem } from '@skeletonlabs/skeleton';
	import ColorSettingAdjustmentControl from './ColorSettingAdjustmentControl.svelte';
	import {
		colorDynamicOptions,
		colorOptions,
		type ColorSetting,
		type MapSettingConfigColor,
		type SelectOption,
	} from './mapSettings';
	import { isDefined } from './utils';

	export let value: ColorSetting;
	export let config: MapSettingConfigColor;

	let options: SelectOption[] = [...colorOptions, ...$colorDynamicOptions];
	$: groups = Array.from(new Set(options.map((option) => option.group).filter(isDefined)));
</script>

<div class="bg-surface-800 rounded-lg">
	<div class="">
		<label class="flex items-baseline">
			<!-- <span class="w-24">Color</span> -->
			<select
				class="select"
				value={value.color}
				on:change={(e) => {
					value = { ...value, color: e.currentTarget.value };
				}}
			>
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
		</label>
	</div>
	<Accordion
		regionControl="text-sm text-secondary-300"
		hover="hover:bg-secondary-700"
		padding="p-2"
		spacing="space-y-1"
		regionPanel="pt-0"
	>
		<AccordionItem>
			<svelte:fragment slot="summary">
				Adjustments <div class="inline-block relative">
					<span class="badge-icon variant-filled-secondary absolute top-[-14px] left-0">
						{value.colorAdjustments?.length ?? 0}
					</span>
				</div>
			</svelte:fragment>
			<div slot="content" class="flex-col space-y-1">
				{#each value.colorAdjustments as adjustment}
					<ColorSettingAdjustmentControl
						{config}
						{adjustment}
						on:typeChange={(e) => {
							value = {
								...value,
								colorAdjustments: value.colorAdjustments.map((a) =>
									a === adjustment ? { ...a, type: e.detail } : a,
								),
							};
						}}
						on:valueChange={(e) => {
							value = {
								...value,
								colorAdjustments: value.colorAdjustments.map((a) =>
									a === adjustment ? { ...a, value: e.detail } : a,
								),
							};
						}}
						on:delete={() => {
							value = {
								...value,
								colorAdjustments: value.colorAdjustments.filter((a) => a !== adjustment),
							};
						}}
					/>
				{/each}
				<button
					type="button"
					class="btn btn-sm variant-filled-secondary"
					on:click={() => {
						value = {
							...value,
							colorAdjustments: [...value.colorAdjustments, { type: undefined, value: 0 }],
						};
					}}
				>
					+ Add Adjustment
				</button>
			</div>
		</AccordionItem>
	</Accordion>
</div>
