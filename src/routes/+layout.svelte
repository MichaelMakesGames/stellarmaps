<script>
	import { AppBar, AppShell, Toast, initializeStores } from '@skeletonlabs/skeleton';
	import '../app.postcss';
	import Sidebar from '../lib/Sidebar.svelte';

	initializeStores();
</script>

<Toast position="t" background="variant-filled-error" />
<AppShell slotPageContent="h-full" regionPage="h-full">
	<svelte:fragment slot="header">
		<AppBar>StellarMaps</AppBar>
	</svelte:fragment>
	<svelte:fragment slot="sidebarLeft">
		<Sidebar />
	</svelte:fragment>
	<slot />
</AppShell>
