<script lang="ts">
	export let enabled: boolean;
	export let filterId = 'glow';
</script>

{#if enabled}
	<slot filter="url(#{filterId})" />
{/if}
<slot filter="" />
