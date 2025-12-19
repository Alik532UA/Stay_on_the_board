<script lang="ts">
    import { goto } from "$app/navigation";
    import { base } from "$app/paths";
    import { _ } from "svelte-i18n";
    import { logService } from "$lib/services/logService.js";
    import { modalStore } from "$lib/stores/modalStore";
    import AuthModal from "$lib/components/modals/AuthModal.svelte";
    import GameModeButton from "$lib/components/game-modes/GameModeButton.svelte";

    // Props, які передаються через modalStore
    export let onPlay: () => void;
    export let onFeedback: () => void;

    function closeMenu() {
        modalStore.closeModal();
    }

    function navigateTo(route: string) {
        logService.action(`Click: "Навігація: ${route}" (HamburgerMenuModal)`);
        closeMenu();
        goto(`${base}${route}`);
    }

    function openAuthModal() {
        logService.action('Click: "Account" (HamburgerMenuModal)');
        // Замінюємо поточне модальне вікно на AuthModal
        modalStore.showModalAsReplacement({
            component: AuthModal,
            dataTestId: "auth-modal",
            buttons: [],
            variant: "menu",
            closeOnOverlayClick: true,
        });
    }

    function handlePlay() {
        closeMenu();
        if (onPlay) onPlay();
    }

    function handleFeedback() {
        closeMenu();
        if (onFeedback) onFeedback();
    }
</script>

<div class="menu-list-centered" data-testid="menu-list">
    <GameModeButton
        icon="👑"
        text={$_("mainMenu.virtualPlayer")}
        dataTestId="menu-item-play"
        on:click={handlePlay}
    />

    <GameModeButton
        icon="🏆"
        text={$_("rewards.pageTitle")}
        dataTestId="menu-item-rewards"
        on:click={() => navigateTo("/rewards")}
    />

    <GameModeButton
        icon="📝"
        text={$_("mainMenu.rules")}
        dataTestId="menu-item-rules"
        on:click={() => navigateTo("/rules")}
    />

    <GameModeButton
        icon="⚙️"
        text={$_("mainMenu.settings")}
        dataTestId="menu-item-settings"
        on:click={() => navigateTo("/settings")}
    />

    <GameModeButton
        icon="⌨️"
        text={$_("mainMenu.controls")}
        dataTestId="menu-item-controls"
        on:click={() => navigateTo("/settings?tab=hotkeys")}
    />

    <GameModeButton
        icon="🪙"
        text={$_("mainMenu.supporters")}
        dataTestId="menu-item-supporters"
        on:click={() => navigateTo("/supporters")}
    />

    <GameModeButton
        icon="💬"
        text={$_("ui.feedback.title")}
        dataTestId="menu-item-feedback"
        on:click={handleFeedback}
    />

    <GameModeButton
        icon="👤"
        text={$_("mainMenu.account")}
        dataTestId="menu-item-account"
        on:click={openAuthModal}
    />
</div>

<style>
    .menu-list-centered {
        display: flex;
        flex-direction: column;
        gap: 12px;
        width: 100%;
        /* Стилі успадковуються від Modal.svelte (variant-menu), 
           але тут ми гарантуємо центрування контенту */
        box-sizing: border-box;
        margin: 0 auto;
    }
</style>
