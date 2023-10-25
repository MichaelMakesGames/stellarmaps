<script lang="ts">
	import HeroiconArrowPathRoundedSquareMini from './icons/HeroiconArrowPathRoundedSquareMini.svelte';
	import { lastProcessedMapSettings, mapSettingConfig, mapSettings } from './mapSettings';

	$: shouldShow = mapSettingConfig
		.flatMap((group) => group.settings)
		.some(
			(setting) =>
				setting.requiresReprocessing &&
				$lastProcessedMapSettings[setting.id] !== $mapSettings[setting.id],
		);
</script>

{#if shouldShow}
	<button type="submit" class="btn btn-lg variant-filled-primary w-full rounded-none">
		<span><HeroiconArrowPathRoundedSquareMini /></span>
		<span> Reprocess Map </span>
	</button>
{/if}
