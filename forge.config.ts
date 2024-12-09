import { VitePlugin } from '@electron-forge/plugin-vite';
import type { ForgeConfig } from '@electron-forge/shared-types';

const config: ForgeConfig = {
	rebuildConfig: {},
	plugins: [
		new VitePlugin({
			// `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
			// If you are familiar with Vite configuration, it will look really familiar.
			build: [
				{
					entry: 'src/electron/main.ts',
					config: 'vite.electron-main.config.ts',
					target: 'main',
				},
				{
					entry: 'src/electron/preload.cjs',
					config: 'vite.electron-preload.config.ts',
					target: 'preload',
				},
			],
			renderer: [
				{
					name: 'main_window',
					config: 'vite.config.ts',
				},
			],
		}),
	],
};

export default config;
