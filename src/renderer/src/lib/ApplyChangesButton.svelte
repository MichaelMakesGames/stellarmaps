<script lang="ts">
	import HeroiconPaintBrushMini from './icons/HeroiconPaintBrushMini.svelte';
	import {
		editedMapSettings,
		mapSettingConfig,
		mapSettings,
		settingsAreDifferent,
		validateSetting,
	} from './mapSettings';

	$: shouldShow = settingsAreDifferent($editedMapSettings, $mapSettings);
	$: valid = mapSettingConfig
		.flatMap((category) => category.settings)
		.every((config) => validateSetting($editedMapSettings[config.id], config)[0]);
</script>

{#if shouldShow}
	<button
		type="submit"
		class="btn btn-lg w-full rounded-none"
		class:variant-filled-primary={valid}
		class:variant-filled-error={!valid}
		disabled={!valid}
	>
		<span><HeroiconPaintBrushMini /></span>
		<span>Apply Changes</span>
		<span class="invisible"><HeroiconPaintBrushMini /></span>
	</button>
{/if}
