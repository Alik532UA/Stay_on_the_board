<script lang="ts">
	import Header from './Header.svelte';
	import '../app.css';
	import { appSettingsStore } from '$lib/stores/appSettingsStore';
	import { gameSettingsStore } from '$lib/stores/gameSettingsStore';
  import { settingsPersistenceService } from '$lib/services/SettingsPersistenceService';
  import { debounce } from '$lib/utils/debounce';
	import { uiStateStore } from '$lib/stores/uiStateStore.js';
	import { initializeI18n, i18nReady } from '$lib/i18n/init.js';
	import { appVersion } from '$lib/stores/versionStore.js';
	import { assets } from '$app/paths';
	import { onMount, onDestroy } from 'svelte';
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
	import hotkeyService from '$lib/services/hotkeyService';
	import { _, locale } from 'svelte-i18n';
	
	

	let showUpdateNotice = false;
	const APP_VERSION_KEY = 'app_version';

  let testModeEnabled = false;
  let unsubscribeTestMode: () => void;
  
  onMount(() => {
    unsubscribeTestMode = testModeStore.subscribe(state => {
      testModeEnabled = state.isEnabled;
    });
  });

  onDestroy(() => {
    if (unsubscribeTestMode) unsubscribeTestMode();
  });
  
  function handleTestModeChange() {
    toggleTestMode();
  }

	onMount(() => {
    // 1. Initialize app settings (theme, language) FIRST
    appSettingsStore.init();

    // 2. Initialize game settings from localStorage
    const loadedGameSettings = settingsPersistenceService.load();
    gameSettingsStore.set(loadedGameSettings);

    // 3. Subscribe to game settings changes to persist them
    const debouncedSave = debounce(settingsPersistenceService.save, 300);
    const unsubscribeGameSettings = gameSettingsStore.subscribe(settings => {
      debouncedSave(settings);
    });

    // 4. Initialize internationalization
    initializeI18n();

    // 5. Initialize other services and stores
    initializeTestModeSync();

    // 7. Check for app updates
    checkForUpdates();

		if (import.meta.env.DEV) {
			(window as any).appSettingsStore = appSettingsStore;
			(window as any).toggleTestMode = toggleTestMode;
			(window as any).resetAllStores = resetAllStores; // Add reset function to window
		}

    // Hotkeys
		if (import.meta.env.DEV) {
			hotkeyService.register('global', '[', (e: KeyboardEvent) => {
				e.preventDefault();
				showUpdateNotice = !showUpdateNotice;
			});
		}
		hotkeyService.register('global', 't', (e: KeyboardEvent) => {
			if (e.ctrlKey && e.altKey) {
				e.preventDefault();
				toggleTestMode();
			}
		});

    document.body.classList.remove('preload-theme');

    // Cleanup subscriptions on component destroy
    return () => {
      unsubscribeGameSettings();
    };
  });

	async function checkForUpdates() {
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
		} catch (error) {
			logService.error('Failed to check for app update:', error);
		}
	}

	function handleReload() {
		clearCache({ keepAppearance: true });
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

{#if import.meta.env.DEV}
  <div class="test-mode-toggle">
    <button on:click={handleTestModeChange} class:active={testModeEnabled} data-testid="test-mode-btn">
      Test Mode: {testModeEnabled ? 'ON' : 'OFF'}
    </button>
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

  .test-mode-toggle {
    position: fixed;
    bottom: 10px;
    right: 10px;
    z-index: 1000;
  }
  .test-mode-toggle button {
    background: #555;
    color: white;
    border: 2px solid #777;
    padding: 8px 12px;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.2s, border-color 0.2s;
  }
  .test-mode-toggle button.active {
    background: #4CAF50;
    border-color: #81C784;
  }
</style>
