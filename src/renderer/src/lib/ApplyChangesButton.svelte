<script lang="ts">
	import HeroiconArrowPathRoundedSquareMini from './icons/HeroiconArrowPathRoundedSquareMini.svelte';
	import { editedMapSettings, mapSettings, settingsAreDifferent } from './mapSettings';

	$: shouldShow = settingsAreDifferent($editedMapSettings, $mapSettings);
</script>

{#if shouldShow}
	<button type="submit" class="btn btn-lg variant-filled-primary w-full rounded-none">
		<span><HeroiconArrowPathRoundedSquareMini /></span>
		<span>Apply Changes</span>
	</button>
{/if}
