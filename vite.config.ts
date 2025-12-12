import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import { visualizer } from 'rollup-plugin-visualizer';
import { VitePWA, type ManifestOptions, type Display } from 'vite-plugin-pwa';

// ВАЖЛИВО: у vite.config.ts треба використовувати process.env
const base = process.env.VITE_BASE_PATH || '/';

const manifest: Partial<ManifestOptions> = {
	name: 'Твій Хід',
	short_name: 'StayBoard',
	description: 'Стратегічна гра на витривалість та просторову уяву',
	start_url: '/Stay_on_the_board/',
	display: 'standalone' as Display,
	background_color: '#222',
	theme_color: '#222',
	lang: 'uk',
	icons: [
		{
			src: '/favicon-32px.ico',
			sizes: '32x32',
			type: 'image/x-icon'
		},
		{
			src: '/favicon.svg',
			sizes: 'any',
			type: 'image/svg+xml'
		}
	]
};

export default defineConfig({
	base,
	plugins: [
		sveltekit(),
		visualizer({
			filename: 'bundle-stats.html',
			template: 'treemap',
			open: false,
			sourcemap: true
		}),
		VitePWA({
			registerType: 'autoUpdate',
			manifest,
			workbox: {
				clientsClaim: true,
				skipWaiting: true,
				globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2,json}']
			}
		})
	],
	build: {
		sourcemap: true,
	},
	test: {
    include: ['tests/**/*.test.ts']
  }
});
