<script>
	import { computePosition, autoUpdate, offset, shift, flip, arrow } from '@floating-ui/dom';
	import {
		AppBar,
		AppShell,
		Modal,
		Toast,
		initializeStores,
		storePopup,
	} from '@skeletonlabs/skeleton';
	import '../app.postcss';
	import Sidebar from '../lib/Sidebar.svelte';
	import ExportModal from '../lib/ExportModal.svelte';

	initializeStores();
	storePopup.set({ computePosition, autoUpdate, offset, shift, flip, arrow });
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
