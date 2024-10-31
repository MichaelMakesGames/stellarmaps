import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
	plugins: [
		svelte({ configFile: '../../svelte.config.mjs' }),
		viteStaticCopy({
			targets: [
				{
					src: '../../node_modules/pathkit-wasm/bin/pathkit.wasm',
					dest: '/',
				},
			],
		}),
	],
	root: 'src/renderer',
	build: {
		outDir: '../../build',
	},
});
