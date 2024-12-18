import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

export default defineConfig({
	build: { outDir: '.vite/build' },
	plugins: [svelte({ configFile: 'svelte.config.mjs' })],
});
