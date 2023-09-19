<script>
	import { AppBar, AppShell, Modal, Toast, initializeStores } from '@skeletonlabs/skeleton';
	import '../app.postcss';
	import Sidebar from '../lib/Sidebar.svelte';
	import ExportModal from '../lib/ExportModal.svelte';

	initializeStores();
</script>

<Toast position="t" background="variant-filled-error" />
<Modal components={{ export: { ref: ExportModal } }} />
<AppShell slotPageContent="h-full" regionPage="h-full">
	<svelte:fragment slot="header">
		<AppBar>StellarMaps</AppBar>
	</svelte:fragment>
	<svelte:fragment slot="sidebarLeft">
		<Sidebar />
	</svelte:fragment>
	<slot />
</AppShell>
