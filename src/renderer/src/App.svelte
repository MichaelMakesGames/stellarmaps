<script>
	import { arrow, autoUpdate, computePosition, flip, offset, shift } from '@floating-ui/dom';
	import {
		AppBar,
		AppShell,
		Modal,
		Toast,
		initializeStores,
		storePopup,
	} from '@skeletonlabs/skeleton';
	import './app.postcss';
	import ExportModal from './lib/ExportModal.svelte';
	import Sidebar from './lib/Sidebar.svelte';
	import VersionInfo from './lib/VersionInfo.svelte';
	import Discord from './lib/icons/Discord.svelte';
	import MapContainer from './lib/map/MapContainer.svelte';

	initializeStores();
	storePopup.set({ computePosition, autoUpdate, offset, shift, flip, arrow });
</script>

<Toast position="t" background="variant-filled-error" />
<Modal components={{ export: { ref: ExportModal } }} />
<AppShell slotPageContent="h-full" regionPage="h-full">
	<svelte:fragment slot="header">
		<AppBar>
			<svelte:fragment slot="lead">
				StellarMaps
				<VersionInfo />
			</svelte:fragment>
			<svelte:fragment slot="trail">
				<a class="anchor" href="https://discord.gg/72kaXW782b" target="_blank" rel="noopener">
					<Discord />
				</a>
			</svelte:fragment>
		</AppBar>
	</svelte:fragment>
	<svelte:fragment slot="sidebarLeft">
		<Sidebar />
	</svelte:fragment>
	<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"></div>
	<MapContainer />
</AppShell>
