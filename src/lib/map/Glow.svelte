<script lang="ts">
	export let enabled: boolean;
</script>

{#if enabled}
	<slot filter="url(#glow)" />
{/if}
<slot filter="" />
