<script lang="ts">
	import ReprocessIcon from './ReprocessIcon.svelte';
	import { lastProcessedMapSettings, mapSettingConfig, mapSettings } from './mapSettings';

	$: shouldShow = mapSettingConfig
		.flatMap((group) => group.settings)
		.some(
			(setting) =>
				setting.requiresReprocessing &&
				$lastProcessedMapSettings[setting.id] !== $mapSettings[setting.id]
		);
</script>

{#if shouldShow}
	<button type="submit" class="btn btn-lg variant-filled-primary w-full rounded-none">
		<span><ReprocessIcon /></span>
		<span> Reprocess Map </span>
	</button>
{/if}
