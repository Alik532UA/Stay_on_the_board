import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

// Видаляємо залежність від змінної оточення
// const base = process.env.VITE_BASE_PATH || '';
const base = '/Stay_on_the_board'; // <-- Жорстко прописуємо шлях

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