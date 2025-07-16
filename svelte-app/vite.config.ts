import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';
import { VitePWA } from 'vite-plugin-pwa';
import manifest from './static/manifest.json';

// ВАЖЛИВО: у vite.config.ts треба використовувати process.env
const base = process.env.VITE_BASE_PATH || '/';

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
				skipWaiting: true
			}
		})
	]
});
