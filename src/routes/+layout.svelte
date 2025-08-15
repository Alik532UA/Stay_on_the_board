<svelte:head>
	<title>Stay on the Board</title>
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<meta name="description" content="Кожен хід має значення. Продумайте свій шлях, щоб залишитися на дошці та перемогти у грі на витривалість!" />
	<link rel="icon" href="{assets}/favicon-32px.ico" sizes="32x32" />
	<link rel="icon" href="{assets}/favicon-16px.ico" sizes="16x16" />
	<link rel="canonical" href="https://stay-on-the-board.com/" />
	<meta property="og:title" content="Stay on the Board" />
	<meta property="og:description" content="Кожен хід має значення. Продумайте свій шлях, щоб залишитися на дошці та перемогти у грі на витривалість!" />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://stay-on-the-board.com/" />
	<meta property="og:image" content="{assets}/logo-circle.png" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Stay on the Board" />
	<meta name="twitter:description" content="Кожен хід має значення. Продумайте свій шлях, щоб залишитися на дошці та перемогти у грі на витривалість!" />
	<meta name="twitter:image" content="{assets}/logo-circle.png" />
</svelte:head>

<script lang="ts">
	import Header from './Header.svelte';
	import '../app.css';
	import { settingsStore } from '$lib/stores/settingsStore.ts';
	import { get } from 'svelte/store';
	import { initializeI18n, i18nReady } from '$lib/i18n/init.js';
	import { assets } from '$app/paths';
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import UpdateNotification from '$lib/components/UpdateNotification.svelte';
	import { clearCache } from '$lib/utils/cacheManager.js';
	import Modal from '$lib/components/Modal.svelte';
	import { navigating } from '$app/stores';
	import { modalStore } from '$lib/stores/modalStore.js';
	import { afterNavigate } from '$app/navigation';
	import DontShowAgainCheckbox from '$lib/components/DontShowAgainCheckbox.svelte';
	import { modalState } from '$lib/stores/modalStore.js';
	import { logService } from '$lib/services/logService.js';
	import PlayerColorProvider from '$lib/components/PlayerColorProvider.svelte';
	import TestModeWidget from '$lib/components/widgets/TestModeWidget.svelte';
	import { gameOrchestrator } from '$lib/gameOrchestrator';
	import { userActionService } from '$lib/services/userActionService';
	import { gameModeService } from '$lib/services/gameModeService';

	let showUpdateNotice = false;
	const APP_VERSION_KEY = 'app_version';

	onMount(async () => {
		try {
			// Додаємо випадковий параметр, щоб уникнути кешування самого файлу версії
			const response = await fetch(`${base}/version.json?v=${new Date().getTime()}`);
			if (!response.ok) return;

			const serverVersionData = await response.json();
			const serverVersion = serverVersionData.version;
			const localVersion = localStorage.getItem(APP_VERSION_KEY);

			if (localVersion && localVersion !== serverVersion) {
				showUpdateNotice = true;
			} else if (!localVersion) {
				// Якщо версії ще немає, просто записуємо її
				localStorage.setItem(APP_VERSION_KEY, serverVersion);
			}
			settingsStore.init(); // <-- Ініціалізуємо налаштування на клієнті
			initializeI18n(); // Ініціалізуємо локалізацію
		} catch (error) {
			logService.init('Failed to check for app update:', error);
		}

		if (import.meta.env.DEV || get(settingsStore).testMode) {
			(window as any).gameOrchestrator = gameOrchestrator; // Залишаємо для зворотної сумісності, поки всі тести не переведено
			(window as any).userActionService = userActionService;
			(window as any).gameModeService = gameModeService;
			(window as any).settingsStore = settingsStore; // Додаємо settingsStore для доступу в тестах
		}
	});

	onMount(() => {
		document.body.classList.remove('preload-theme');
	});

	function handleReload() {
		// Очищуємо кеш, зберігаючи вигляд, і перезавантажуємо
		clearCache({ keepAppearance: true });
	}

	function handleDevKeys(event: KeyboardEvent) {
		if (import.meta.env.DEV && event.code === 'BracketRight') {
			event.preventDefault();
			showUpdateNotice = !showUpdateNotice;
		}
		if (event.ctrlKey && event.altKey && event.code === 'KeyT') {
			event.preventDefault();
			settingsStore.toggleTestMode();
		}
	}

	// Видалено гарячу клавішу для переходу на /dev-dnd-columns
	// onMount(() => {
	//   if (import.meta.env.DEV) {
	//     window.addEventListener('keydown', (e: KeyboardEvent) => {
	//       if (e.key === '[') {
	//         window.location.href = '/dev-dnd-columns';
	//       }
	//     });
	//   }
	// });

	// onMount(() => {
	// 	document.documentElement.setAttribute('data-theme', 'dark');
	// 	document.documentElement.setAttribute('data-style', 'purple');
	// });

	afterNavigate(() => {
		// Не закриваємо модальне вікно, якщо ми щойно відновили його зі сторінки replay
		if (sessionStorage.getItem('isRestoringReplay')) {
			sessionStorage.removeItem('isRestoringReplay');
			return;
		}
		modalStore.closeModal();
	});
</script>

<svelte:window on:keydown={handleDevKeys} />

{#if showUpdateNotice}
	<UpdateNotification on:reload={handleReload} />
{/if}

<div class="app">
	{#if false}
		<Header />
	{/if}

	<main>
		{#if $i18nReady}
			<slot />
		{:else}
			<div>Loading...</div>
		{/if}
	</main>

	{#if false}
		<footer>
			<p>
				visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to learn about SvelteKit
			</p>
		</footer>
	{/if}
</div>

<Modal />
<PlayerColorProvider />

{#if $settingsStore.testMode}
	<div class="test-mode-container" data-testid="test-mode-widget-container">
		<TestModeWidget />
	</div>
{/if}

<style>
	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	.test-mode-container {
		position: fixed;
		bottom: 60px;
		right: 10px;
		z-index: 1001;
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
