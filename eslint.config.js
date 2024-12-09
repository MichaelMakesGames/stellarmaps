import globals from 'globals';
import pluginJs from '@eslint/js';
import tsEslint from 'typescript-eslint';
import eslintPluginSvelte from 'eslint-plugin-svelte';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import eslintConfigPrettier from 'eslint-config-prettier';

import svelteConfig from './svelte.config.mjs';

const extraFileExtensions = ['.svelte'];

/** @type {import('eslint').Linter.Config[]} */
export default [
	{ files: ['**/*.{ts}'] },
	{ languageOptions: { globals: { ...globals.browser, ...globals.node } } },
	pluginJs.configs.recommended,
	// ts
	...tsEslint.configs.recommended,
	{
		languageOptions: {
			parserOptions: {
				extraFileExtensions,
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
	},
	// svelte
	...eslintPluginSvelte.configs['flat/recommended'],
	{
		files: ['src/**/*.svelte'],
		languageOptions: {
			parserOptions: {
				extraFileExtensions,
				parser: tsEslint.parser,
				svelteConfig: svelteConfig,
			},
		},
	},
	// prettier
	eslintConfigPrettier,
	...eslintPluginSvelte.configs['flat/prettier'],
	// other
	{
		plugins: {
			'simple-import-sort': simpleImportSort,
		},
		rules: {
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
			'@typescript-eslint/prefer-nullish-coalescing': 'error',
			'@typescript-eslint/strict-boolean-expressions': ['error', { allowNullableBoolean: true }],
			'@typescript-eslint/no-unnecessary-condition': 'error',
			'simple-import-sort/imports': 'error',
			'simple-import-sort/exports': 'error',
		},
	},
	{
		ignores: [
			'.git/',
			'.DS_Store/',
			'.vite',
			'node_modules/',
			'src-tauri/',
			'out/',
			'dist/',
			'build/',
			'scripts/',
			'resources/',
			'examples/',
			'patches/',
			'package-lock.json',
			// config files
			'tailwind.config.ts',
			'eslint.config.js',
			'vite.config.ts',
			'postcss.config.cjs',
			'electron.vite.config.ts',
			'svelte.config.mjs',
			'commitlint.config.cjs',
		],
	},
];
