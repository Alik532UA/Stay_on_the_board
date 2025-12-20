<script lang="ts">
	import Header from "./Header.svelte";
	import "../app.css";
	import { appInitializationService } from "$lib/services/appInitializationService";
	import { appVersion } from "$lib/stores/versionStore";
	import { onMount, onDestroy } from "svelte";
	import { base } from "$app/paths";
	import UpdateNotification from "$lib/components/UpdateNotification.svelte";
	import { clearCache } from "$lib/utils/cacheManager.js";
	import Modal from "$lib/components/Modal.svelte";
	import { modalStore } from "$lib/stores/modalStore";
	import { afterNavigate, goto } from "$app/navigation";
	import { logService } from "$lib/services/logService.js";
	import TestModeWidget from "$lib/components/widgets/TestModeWidget.svelte";
	import { tooltipStore } from "$lib/stores/tooltipStore";
	import Tooltip from "$lib/components/Tooltip.svelte";
	import ModalManager from "$lib/components/ModalManager.svelte";
	import { testModeStore, toggleTestMode } from "$lib/stores/testModeStore";
	import { resetAllStores } from "$lib/services/testingService";
	import hotkeyService from "$lib/services/hotkeyService";
	import { i18nReady } from "$lib/i18n/init.js";
	import RewardNotification from "$lib/components/rewards/RewardNotification.svelte";

	// Imports for Menus
	import FlexibleMenu from "$lib/components/ui/FlexibleMenu/FlexibleMenu.svelte";
	import type { IMenuItem } from "$lib/components/ui/FlexibleMenu/FlexibleMenu.types";
	import GameModeModal from "$lib/components/GameModeModal.svelte";
	import DevMenu from "$lib/components/main-menu/DevMenu.svelte";
	import FeedbackModal from "$lib/components/modals/FeedbackModal.svelte";

	import { roomService } from "$lib/services/roomService";
	import "$lib/services/commandService";

	let showUpdateNotice = false;
	const APP_VERSION_KEY = "app_version";

	let testModeEnabled = false;
	let unsubscribeTestMode: () => void;

	onMount(() => {
		// Centralized initialization
		appInitializationService.initialize();

		unsubscribeTestMode = testModeStore.subscribe((state) => {
			testModeEnabled = state.isEnabled;
		});

		// Check for active online session
		checkOnlineSession();

		// Subscribe to version changes to show update notice
		const unsubscribeVersion = appVersion.subscribe((serverVersion) => {
			const localVersion = localStorage.getItem(APP_VERSION_KEY);
			if (
				serverVersion &&
				localVersion &&
				localVersion !== serverVersion
			) {
				showUpdateNotice = true;
			}
		});

		if (import.meta.env.DEV) {
			(window as any).toggleTestMode = toggleTestMode;
			(window as any).resetAllStores = resetAllStores;
		}

		// REMOVED: Global hotkeys registration
		// hotkeyService.register("global", "[", ...);
		// hotkeyService.register("global", "t", ...);

		return () => {
			appInitializationService.cleanup();
			unsubscribeVersion();
		};
	});

	onDestroy(() => {
		if (unsubscribeTestMode) unsubscribeTestMode();
	});

	async function checkOnlineSession() {
		const session = roomService.getSession();
		if (session.roomId && session.playerId) {
			logService.init(
				`[Layout] Found active session for room ${session.roomId}`,
			);
			const path = window.location.pathname;
			const basePath = base || "";
			if (
				path === basePath + "/" ||
				path === basePath + "/online" ||
				path === basePath + "/online/"
			) {
				goto(`${base}/online/lobby/${session.roomId}`);
			}
		}
	}

	function handleReload() {
		clearCache({ keepAppearance: true });
	}

	afterNavigate(() => {
		if (sessionStorage.getItem("isRestoringReplay")) {
			sessionStorage.removeItem("isRestoringReplay");
			return;
		}
		modalStore.closeModal();
		logService.ui("[layout] afterNavigate: hiding tooltip");
		tooltipStore.hide();
	});

	// --- Menu Logic ---
	function handlePlayVirtualPlayer() {
		modalStore.showModal({
			titleKey: "mainMenu.gameModeModal.title",
			dataTestId: "game-mode-modal",
			component: GameModeModal,
			props: { extended: true },
			variant: "menu", // <--- FIX: Додано variant="menu"
			buttons: [], // <--- FIX: Прибрано кнопки
			closeOnOverlayClick: true, // <--- FIX: Додано закриття по кліку
		});
	}

	function handleFeedback() {
		logService.action('Click: "Feedback" (Layout)');
		modalStore.showModal({
			titleKey: "ui.feedback.title",
			dataTestId: "feedback-modal",
			component: FeedbackModal,
			variant: "menu", // <--- FIX: Додано variant="menu"
			buttons: [], // <--- FIX: Прибрано кнопки
			closeOnOverlayClick: true, // <--- FIX: Додано закриття по кліку
		});
	}

	const menuItems: IMenuItem[] = [
		{ id: "rewards", emoji: "🏆", onClick: () => goto(`${base}/rewards`) },
		{
			id: "donate",
			icon: "donate",
			dataTestId: "donate-btn",
			onClick: () => goto(`${base}/supporters`),
		},
		{
			id: "play",
			icon: "piece",
			onClick: handlePlayVirtualPlayer,
			primary: true,
		},
		{
			id: "settings",
			emoji: "⚙️",
			onClick: () => goto(`${base}/settings`),
		},
		{
			id: "feedback",
			emoji: "💬",
			onClick: handleFeedback,
			dataTestId: "feedback-btn",
		},
	];

	function openDevMenuModal() {
		modalStore.showModal({
			titleKey: "Dev Menu Modal",
			component: DevMenu,
			dataTestId: "dev-menu-modal",
			customClass: "dev-menu-modal-window",
			props: {
				onClose: () => modalStore.closeModal(),
				versionNumber: $appVersion,
			},
		});
	}

	$: devMenuItems = $i18nReady
		? [
				{
					id: "main-menu-link",
					emoji: "🏠",
					onClick: () => goto(`${base}/`),
				},
				{
					id: "main-menu-v2-link",
					emoji: "v2",
					onClick: () => goto(`${base}/test-main-menu-v2`),
					dataTestId: "top-menu-slot-1",
				},
				{
					id: "test-mode-btn",
					emoji: "🛠️",
					onClick: toggleTestMode,
					primary: true,
					isActive: $testModeStore.isEnabled,
				},
				{ id: "dev-menu-modal", emoji: "☰", onClick: openDevMenuModal },
				{
					id: "dev-clear-cache-btn",
					emoji: "🧹",
					onClick: () => clearCache({ keepAppearance: false }),
				},
			]
		: [];
</script>

{#if showUpdateNotice}
	<UpdateNotification on:reload={handleReload} />
{/if}

<RewardNotification />

<div class="app">
	{#if import.meta.env.DEV}
		<FlexibleMenu
			items={devMenuItems}
			position="left"
			persistenceKey="main-left-menu"
			dataTestId="flexible-menu-left-wrapper"
		/>
	{/if}

	<main>
		{#if $i18nReady}
			<slot />
		{:else}
			<div class="loading-screen">Loading...</div>
		{/if}
	</main>

	{#if import.meta.env.DEV}
		<FlexibleMenu
			items={menuItems}
			position="right"
			persistenceKey="main-right-menu"
			dataTestId="flexible-menu-right-wrapper"
			startOpen={false}
		/>
	{/if}
</div>

{#if $tooltipStore.isVisible}
	<Tooltip
		content={$tooltipStore.content}
		x={$tooltipStore.x}
		y={$tooltipStore.y}
	/>
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
		top: 50%;
		right: 10px;
		transform: translateY(-50%);
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
	.loading-screen {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100%;
		color: var(--text-secondary);
	}
</style>
