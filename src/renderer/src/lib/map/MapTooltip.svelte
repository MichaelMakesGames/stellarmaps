<script lang="ts">
	import type { GalacticObject } from '../GameState';
	import { localizeText } from './data/locUtils';

	export let x: number;
	export let y: number;
	export let system: GalacticObject;
</script>

<div
	class="bg-surface-900 py-1 px-2 absolute shadow-sm border border-surface-700 rounded"
	style:top="{y}px"
	style:left="{x}px"
	style:transform="translate(0.5rem, -50%)"
>
	{#await system.name ? localizeText(system.name) : Promise.resolve('LOCALIZATION FAILED')}
		Loading...
	{:then name}
		{name}
	{/await}
</div>
