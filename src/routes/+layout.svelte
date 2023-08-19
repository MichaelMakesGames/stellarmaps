<script>
	import { AppBar, AppShell } from '@skeletonlabs/skeleton';
	import '../app.postcss';
	import Sidebar from '../lib/Sidebar.svelte';
</script>

<AppShell slotPageContent="h-full" regionPage="h-full">
	<svelte:fragment slot="header">
		<AppBar>StellarMaps</AppBar>
	</svelte:fragment>
	<svelte:fragment slot="sidebarLeft">
		<Sidebar />
	</svelte:fragment>
	<slot />
</AppShell>
