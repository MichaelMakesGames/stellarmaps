<script lang="ts">
	import { Accordion, AccordionItem } from '@skeletonlabs/skeleton';
	import ColorSettingControl from './ColorSettingControl.svelte';
	import {
		ICON_POSITIONS,
		iconOptions,
		type IconPosition,
		type IconSetting,
		type MapSettingConfigIcon,
	} from './mapSettings';
	import { isDefined } from './utils';

	export let value: IconSetting;
	export let config: MapSettingConfigIcon;
	let color = value.color;
	$: if (value.color !== color) {
		value = { ...value, color };
	}

	let groups = Array.from(new Set(iconOptions.map((option) => option.group).filter(isDefined)));

	function asIconPosition(s: string) {
		return s as IconPosition;
	}
	function asAny(x: any) {
		return x;
	}
</script>

{#if !value.enabled}
	<div class="rounded-lg bg-surface-800 p-2 text-surface-300">Disabled</div>
{:else}
	<div class="rounded-lg bg-surface-800">
		<div class="p-2 pb-0">
			<label class="flex items-baseline">
				<span class="w-24">Icon</span>
				<select
					class="select"
					value={value.icon}
					on:change={(e) => {
						value = { ...value, icon: e.currentTarget.value };
					}}
				>
					{#each groups as group}
						<optgroup label={group}>
							{#each iconOptions.filter((opt) => opt.group === group) as option (option.id)}
								<option value={option.id}>{option.name}</option>
							{/each}
						</optgroup>
					{/each}
				</select>
			</label>
			<label class="mt-2 flex items-baseline">
				<span class="w-24">Size</span>
				<input
					class="input"
					type="number"
					step="0.5"
					value={value.size}
					on:input={(e) => {
						const parsed = parseFloat(e.currentTarget.value);
						if (!Number.isNaN(parsed)) {
							value = { ...value, size: parsed };
						}
					}}
				/>
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
				<svelte:fragment slot="summary">Advanced Options</svelte:fragment>
				<div slot="content" class="flex-col space-y-1">
					<div class="flex items-baseline text-sm">
						<label for="{config.id}-smoothing" class="ms-1 w-24 cursor-pointer">Position</label>
						<select
							id="{config.id}-position"
							class="select p-1 text-sm"
							value={value.position}
							on:change={(e) => {
								value = {
									...value,
									position: asIconPosition(e.currentTarget.value),
								};
							}}
						>
							{#each ICON_POSITIONS as position}
								<option value={position}>{position}</option>
							{/each}
						</select>
					</div>
					<div class="flex items-baseline text-sm">
						<label for="{config.id}-smoothing" class="ms-1 w-24 cursor-pointer">Priority</label>
						<input
							id="{config.id}-priority"
							class="input p-1 text-sm"
							type="number"
							value={value.priority}
							on:change={(e) => {
								const parsed = parseFloat(e.currentTarget.value);
								if (Number.isNaN(parsed)) {
									value = {
										...value,
										priority: parseInt(e.currentTarget.value),
									};
								}
							}}
						/>
					</div>
				</div>
			</AccordionItem>
		</Accordion>
		<ColorSettingControl
			bind:value={color}
			config={{ id: asAny(`${config.id}-color`), name: `${config.name} Color`, type: 'color' }}
		/>
	</div>
{/if}
