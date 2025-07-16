import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';
import { VitePWA } from 'vite-plugin-pwa';
import manifest from './static/manifest.json';

export default defineConfig({
	base: '/Stay_on_the_board/', // додано для GitHub Pages
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
