<script lang="ts">
	import { Accordion, AccordionItem } from '@skeletonlabs/skeleton';

	import { t } from '../../intl';
	import {
		colorDynamicOptions,
		colorOptions,
		type ColorSetting,
		type SelectOption,
		type SettingConfigColor,
	} from '../settings';
	import { isDefined } from '../utils';
	import ColorSettingAdjustmentControl from './ColorSettingAdjustmentControl.svelte';

	export let value: ColorSetting;
	export let config: SettingConfigColor<unknown, unknown>;

	$: options = [...colorOptions, ...$colorDynamicOptions];
	$: groups = Array.from(
		new Set(
			options
				.map((option) => option.group)
				.filter(isDefined)
				.filter(
					// don't show dynamic colors group if no dynamic colors are allowed
					(group) =>
						!(group === 'option.color.group.dynamic' && config.allowedDynamicColors.length === 0),
				),
		),
	);
	$: selectValue = options.find((option) => option.id === value.color)?.id;

	function filterAllowedOption(option: SelectOption) {
		if (option.group !== 'option.color.group.dynamic') return true;
		return (config.allowedDynamicColors as string[]).includes(option.id);
	}
</script>

<div class="rounded-lg bg-surface-800">
	<div class="p-2 pb-0">
		<label class="flex items-baseline">
			<span class="w-24">{$t('control.color.label')}</span>
			<select
				class="select"
				value={selectValue}
				on:change={(e) => {
					value = { ...value, color: e.currentTarget.value };
				}}
			>
				{#each groups as group}
					<optgroup label={$t(group)}>
						{#each options
							.filter((opt) => opt.group === group)
							.filter(filterAllowedOption) as option (option.id)}
							<option value={option.id}>{option.literalName ?? $t(option.name)}</option>
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
				{$t('control.color.adjustment.header')}
				<div class="relative inline-block">
					<span class="variant-filled-secondary badge-icon absolute left-0 top-[-14px]">
						{value.colorAdjustments.length}
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
					class="variant-filled-secondary btn btn-sm"
					on:click={() => {
						value = {
							...value,
							colorAdjustments: [...value.colorAdjustments, { type: undefined, value: 0 }],
						};
					}}
				>
					{$t('control.color.adjustment.add_button')}
				</button>
			</div>
		</AccordionItem>
	</Accordion>
</div>
