<script>
	import { t } from '../intl';
	import SettingControl from './SettingControl/index.svelte';
	import { appSettings, appSettingsConfig, asUnknownSettingConfig } from './settings';
</script>

<form
	class="bg-surface-100-800-token modal block h-auto w-[32rem] space-y-4 overflow-y-auto p-4 shadow-xl rounded-container-token"
	role="dialog"
	aria-modal="true"
	novalidate
>
	<header class="modal-header text-2xl font-bold">{$t('app_settings.title')}</header>
	<p>{$t('app_settings.description')}</p>
	<div class="flex flex-col gap-4">
		{#each appSettingsConfig as config}
			<SettingControl config={asUnknownSettingConfig(config)} settings={appSettings} />
		{/each}
	</div>
	<footer class="modal-footer flex justify-end space-x-2">
		<button class="variant-ghost-surface btn" type="button">{$t('generic.close_button')}</button>
	</footer>
</form>
