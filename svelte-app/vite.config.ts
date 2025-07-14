import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
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
			manifest: require('./static/manifest.json'),
			workbox: {
				clientsClaim: true,
				skipWaiting: true
			}
		})
	]
});
