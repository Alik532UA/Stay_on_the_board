<script lang="ts">
    import { goto } from "$app/navigation";
    import { base } from "$app/paths";
    import { _ } from "svelte-i18n";
    import { logService } from "$lib/services/logService.js";
    import { modalStore } from "$lib/stores/modalStore";
    import AuthModal from "$lib/components/modals/AuthModal.svelte";
    import GameModeButton from "$lib/components/game-modes/GameModeButton.svelte";
    import NotoEmoji from "$lib/components/NotoEmoji.svelte";

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
        text={$_("mainMenu.virtualPlayer")}
        dataTestId="menu-item-play"
        on:click={handlePlay}
    >
        <div slot="icon"><NotoEmoji name="crown" size="100%" /></div>
    </GameModeButton>

    <GameModeButton
        text={$_("rewards.pageTitle")}
        dataTestId="menu-item-rewards"
        on:click={() => navigateTo("/rewards")}
    >
        <div slot="icon"><NotoEmoji name="trophy" size="100%" /></div>
    </GameModeButton>

    <GameModeButton
        text={$_("mainMenu.rules")}
        dataTestId="menu-item-rules"
        on:click={() => navigateTo("/rules")}
    >
        <div slot="icon"><NotoEmoji name="memo" size="100%" /></div>
    </GameModeButton>

    <GameModeButton
        text={$_("mainMenu.settings")}
        dataTestId="menu-item-settings"
        on:click={() => navigateTo("/settings")}
    >
        <div slot="icon"><NotoEmoji name="gear" size="100%" /></div>
    </GameModeButton>

    <GameModeButton
        text={$_("mainMenu.controls")}
        dataTestId="menu-item-controls"
        on:click={() => navigateTo("/settings?tab=hotkeys")}
    >
        <div slot="icon"><NotoEmoji name="keyboard" size="100%" /></div>
    </GameModeButton>

    <GameModeButton
        text={$_("mainMenu.supporters")}
        dataTestId="menu-item-supporters"
        on:click={() => navigateTo("/supporters")}
    >
        <div slot="icon"><NotoEmoji name="coin" size="100%" /></div>
    </GameModeButton>

    <GameModeButton
        text={$_("ui.feedback.title")}
        dataTestId="menu-item-feedback"
        on:click={handleFeedback}
    >
        <div slot="icon"><NotoEmoji name="speech_balloon" size="100%" /></div>
    </GameModeButton>

    <GameModeButton
        text={$_("mainMenu.account")}
        dataTestId="menu-item-account"
        on:click={openAuthModal}
    >
        <div slot="icon">
            <NotoEmoji name="bust_in_silhouette" size="100%" />
        </div>
    </GameModeButton>
</div>

<style>
    .menu-list-centered {
        display: flex;
        flex-direction: column;
        gap: 12px;
        width: 100%;
        box-sizing: border-box;
        margin: 0 auto;
    }
</style>
