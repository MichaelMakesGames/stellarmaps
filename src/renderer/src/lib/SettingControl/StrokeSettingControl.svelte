<script lang="ts">
	import { Accordion, AccordionItem } from '@skeletonlabs/skeleton';
	import { fade } from 'svelte/transition';
	import { t } from '../../intl';
	import type { SettingConfigStroke, StrokeSetting } from '../settings';

	export let value: StrokeSetting;
	export let config: SettingConfigStroke<Record<string, any>, string>;
</script>

{#if !value.enabled}
	<div class="rounded-lg bg-surface-800 p-2 text-surface-300">{$t('generic.disabled')}</div>
{:else}
	<div class="rounded-lg bg-surface-800">
		<div class="p-2 pb-0">
			<label class="flex items-baseline">
				<span class="w-24">{$t('control.stroke.width')}</span>
				<input
					class="input"
					type="number"
					step="0.5"
					value={value.width}
					on:input={(e) => {
						const parsed = parseFloat(e.currentTarget.value);
						if (!Number.isNaN(parsed)) {
							value = { ...value, width: parsed };
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
				<svelte:fragment slot="summary">{$t('control.stroke.more_styles.header')}</svelte:fragment>
				<div slot="content" class="flex-col space-y-1">
					{#if !config.noSmoothing}
						<div class="flex text-sm">
							<input
								id="{config.id}-smoothing"
								type="checkbox"
								class="checkbox"
								checked={value.smoothing}
								on:change={(e) => {
									value = {
										...value,
										smoothing: e.currentTarget.checked,
									};
								}}
							/>
							<label for="{config.id}-smoothing" class="ms-1 grow cursor-pointer">
								{$t('control.stroke.more_styles.smoothed')}
							</label>
						</div>
					{/if}
					<div class="flex text-sm">
						<input
							id="{config.id}-glow"
							type="checkbox"
							class="checkbox"
							checked={value.glow}
							on:change={(e) => {
								value = {
									...value,
									glow: e.currentTarget.checked,
								};
							}}
						/>
						<label for="{config.id}-glow" class="ms-1 grow cursor-pointer">
							{$t('control.stroke.more_styles.glow')}
						</label>
					</div>
					{#if !config.noDashed}
						<div class="flex text-sm">
							<input
								id="{config.id}-dashed"
								type="checkbox"
								class="checkbox"
								checked={value.dashed}
								on:change={(e) => {
									value = {
										...value,
										dashed: e.currentTarget.checked,
									};
								}}
							/>
							<label for="{config.id}-dashed" class="ms-1 grow cursor-pointer">
								{$t('control.stroke.more_styles.dashed')}
							</label>
							{#if value.dashed}
								<label class="text-surface-300" for="{config.id}-dashArray" transition:fade>
									{$t('control.stroke.more_styles.dash_pattern')}
								</label>
								<input
									id="{config.id}-dashArray"
									type="text"
									class="input -my-1 ms-1 h-6 w-1/3 text-sm"
									transition:fade
									value={value.dashArray}
									on:input={(e) => {
										value = {
											...value,
											dashArray: e.currentTarget.value,
										};
									}}
								/>
							{/if}
						</div>
					{/if}
				</div>
			</AccordionItem>
		</Accordion>
	</div>
{/if}
