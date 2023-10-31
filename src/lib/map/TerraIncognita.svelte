<script lang="ts">
	import { mapSettings } from '../mapSettings';
	import type { MapData } from './data/processMapData';
	export let data: MapData;
	$: terraIncognitaColor = `rgb(${$mapSettings.terraIncognitaBrightness},${$mapSettings.terraIncognitaBrightness},${$mapSettings.terraIncognitaBrightness})`;
</script>

{#if $mapSettings.terraIncognita}
	<!-- filtered and patterned path disappears at some zoom levels -->
	<!-- always draw a flat terra incognita underneath as a fallback -->
	<path id="terra-incognita-fallback" d={data.terraIncognitaPath} fill={terraIncognitaColor} />
	<path
		id="terra-incognita"
		d={data.terraIncognitaPath}
		fill={$mapSettings.terraIncognitaStyle === 'striped'
			? 'url(#dark-stripes)'
			: terraIncognitaColor}
		filter={$mapSettings.terraIncognitaStyle === 'cloudy' ? 'url(#terra-incognita-filter)' : ''}
	/>
{/if}
