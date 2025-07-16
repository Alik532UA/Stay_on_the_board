import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const base = process.env.VITE_BASE_PATH || '';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// Використовується adapter-static для GitHub Pages
		adapter: adapter({
			fallback: 'index.html'
		}),
		prerender: {
			entries: ['*']
		},
		paths: {
			base
		}
	}
};

export default config;
