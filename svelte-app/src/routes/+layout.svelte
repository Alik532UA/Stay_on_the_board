<svelte:head>
	<title>Stay on the Board</title>
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<meta name="description" content="Мультиплатформова настільна гра з підтримкою онлайн-режиму, локалізації та сучасного UI/UX." />
	<link rel="icon" href="/favicon-32px.ico" sizes="32x32" />
	<link rel="icon" href="/favicon-16px.ico" sizes="16x16" />
	<link rel="canonical" href="https://stay-on-the-board.com/" />
	<meta property="og:title" content="Stay on the Board" />
	<meta property="og:description" content="Мультиплатформова настільна гра з підтримкою онлайн-режиму, локалізації та сучасного UI/UX." />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://stay-on-the-board.com/" />
	<meta property="og:image" content="/logo-circle.png" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Stay on the Board" />
	<meta name="twitter:description" content="Мультиплатформова настільна гра з підтримкою онлайн-режиму, локалізації та сучасного UI/UX." />
	<meta name="twitter:image" content="/logo-circle.png" />
</svelte:head>

<script lang="ts">
	import Header from './Header.svelte';
	import '../app.css';
	import { onMount } from 'svelte';
	import { settingsStore } from '../stores/settingsStore.js';
	import { get } from 'svelte/store';
	import '../lib/i18n/init.js';

	onMount(() => {
		document.documentElement.setAttribute('data-theme', 'dark');
		document.documentElement.setAttribute('data-style', 'classic');
	});
</script>

<div class="app">
	{#if false}
		<Header />
	{/if}

	<main>
		<slot />
	</main>

	{#if false}
		<footer>
			<p>
				visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to learn about SvelteKit
			</p>
		</footer>
	{/if}
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	main {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 1rem;
		width: 100%;
		max-width: 64rem;
		margin: 0 auto;
		box-sizing: border-box;
	}

	footer {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		padding: 12px;
	}

	footer a {
		font-weight: bold;
	}

	@media (min-width: 480px) {
		footer {
			padding: 12px 0;
		}
	}
</style>
