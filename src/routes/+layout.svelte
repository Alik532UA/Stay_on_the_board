<script lang="ts">
	import Header from './Header.svelte';
	import '../app.css';
	import { appSettingsStore } from '$lib/stores/appSettingsStore';
	import { get } from 'svelte/store';
	import { initializeI18n, i18nReady } from '$lib/i18n/init.js';
	import { appVersion } from '$lib/stores/versionStore.js';
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
	import TestModeWidget from '$lib/components/widgets/TestModeWidget.svelte';
	import { tooltipStore } from '$lib/stores/tooltipStore.js';
	import Tooltip from '$lib/components/Tooltip.svelte';
	import ModalManager from '$lib/components/ModalManager.svelte';
	import { testModeStore, toggleTestMode } from '$lib/stores/testModeStore';
	import { initializeTestModeSync } from '$lib/services/testModeService';
	import { resetAllStores } from '$lib/services/testingService';

	let showUpdateNotice = false;
	const APP_VERSION_KEY = 'app_version';

	onMount(async () => {
		try {
			const response = await fetch(`${base}/version.json?v=${new Date().getTime()}`);
			if (!response.ok) return;

			const serverVersionData = await response.json();
			const serverVersion = serverVersionData.version;
			const localVersion = localStorage.getItem(APP_VERSION_KEY);
			appVersion.set(serverVersion);

			if (localVersion && localVersion !== serverVersion) {
				showUpdateNotice = true;
			} else if (!localVersion) {
				localStorage.setItem(APP_VERSION_KEY, serverVersion);
			}
			appSettingsStore.init();
			initializeI18n();
			initializeTestModeSync(); // <-- ДОДАНО: Ініціалізація сервісу-моста
		} catch (error) {
			logService.init('Failed to check for app update:', error);
		}

		if (import.meta.env.DEV) {
			(window as any).appSettingsStore = appSettingsStore;
			(window as any).toggleTestMode = toggleTestMode;
			(window as any).resetAllStores = resetAllStores; // Add reset function to window
		}
	});

	onMount(() => {
		document.body.classList.remove('preload-theme');
	});

	function handleReload() {
		clearCache({ keepAppearance: true });
	}

	function handleDevKeys(event: KeyboardEvent) {
		if (import.meta.env.DEV && event.code === 'BracketRight') {
			event.preventDefault();
			showUpdateNotice = !showUpdateNotice;
		}
		if (event.ctrlKey && event.altKey && event.code === 'KeyT') {
			event.preventDefault();
			toggleTestMode();
		}
	}

	afterNavigate(() => {
		if (sessionStorage.getItem('isRestoringReplay')) {
			sessionStorage.removeItem('isRestoringReplay');
			return;
		}
		modalStore.closeModal();
		logService.ui('[layout] afterNavigate: hiding tooltip');
		tooltipStore.hide();
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

{#if $tooltipStore.isVisible}
	<Tooltip content={$tooltipStore.content} x={$tooltipStore.x} y={$tooltipStore.y} />
{/if}
<Modal />
<ModalManager />

{#if $testModeStore.isEnabled}
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