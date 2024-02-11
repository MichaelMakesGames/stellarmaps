<script lang="ts">
	import HeroiconPaintBrushMini from './icons/HeroiconPaintBrushMini.svelte';
	import { editedMapSettings, mapSettings, settingsAreDifferent } from './mapSettings';

	$: shouldShow = settingsAreDifferent($editedMapSettings, $mapSettings);
</script>

{#if shouldShow}
	<button type="submit" class="variant-filled-primary btn btn-lg w-full rounded-none">
		<span><HeroiconPaintBrushMini /></span>
		<span>Apply Changes</span>
		<span class="invisible"><HeroiconPaintBrushMini /></span>
	</button>
{/if}
