<script lang="ts">
	import HeroiconArrowPathRoundedSquareMini from './icons/HeroiconArrowPathRoundedSquareMini.svelte';
	import {
		lastProcessedMapSettings,
		mapSettingConfig,
		mapSettings,
		settingsAreDifferent,
	} from './mapSettings';

	$: shouldShow = settingsAreDifferent($lastProcessedMapSettings, $mapSettings, {
		requiresReprocessingOnly: true,
	});
</script>

{#if shouldShow}
	<button type="submit" class="btn btn-lg variant-filled-primary w-full rounded-none">
		<span><HeroiconArrowPathRoundedSquareMini /></span>
		<span>Reprocess Map</span>
	</button>
{/if}
