<script lang="ts">
    import { _ } from "svelte-i18n";
    import { goto } from "$app/navigation";
    import { base } from "$app/paths";
    import { uiStateStore } from "$lib/stores/uiStateStore.js";
    import { logService } from "$lib/services/logService.js";
    import StyledButton from "$lib/components/ui/StyledButton.svelte";
    import { modalStore } from "$lib/stores/modalStore";

    export let onClose: () => void = () => modalStore.closeModal();
    export let onPlayVsComputer: () => void = () => {};
    export let onLocalGame: () => void = () => {};
    export let versionNumber: string;

    function navigateTo(route: string) {
        goto(`${base}${route}`);
    }

    function handleDevMenuBtn() {
        logService.action('Click: "Drag and Drop Test" (DevMenu)');
        navigateTo("/test");
        onClose();
    }

    function handlePhantomPage(name: string, route: string) {
        logService.action(`Click: "${name}" (DevMenu)`);
        navigateTo(route);
        onClose();
    }

    function handleTimedGame() {
        uiStateStore.update((s) => ({ ...s, intendedGameType: "timed" }));
        navigateTo("/game/timed");
        onClose();
    }

    function handleOnlineGame() {
        uiStateStore.update((s) => ({ ...s, intendedGameType: "online" }));
        navigateTo("/online");
        onClose();
    }
</script>

<div class="dev-menu-content" data-testid="dev-menu-content">
    <h2 class="modal-title-menu">dev v.{versionNumber}</h2>

    <div class="actions-column">
        <!-- Test Pages -->
        <StyledButton
            variant="menu"
            on:click={handleDevMenuBtn}
            dataTestId="dev-menu-dnd-btn"
        >
            {$_("mainMenu.dragAndDropTest")}
        </StyledButton>

        <StyledButton
            variant="menu"
            on:click={() =>
                handlePhantomPage("Button Styles Test", "/test/buttons")}
            dataTestId="dev-menu-buttons-test-btn"
        >
            Button Styles Test
        </StyledButton>

        <StyledButton
            variant="menu"
            on:click={() => {
                navigateTo("/test-main-menu-v2");
                onClose();
            }}
            dataTestId="dev-menu-test-main-menu-btn">Main Menu v2</StyledButton
        >

        <!-- Phantom / WIP Pages -->
        <StyledButton
            variant="menu"
            on:click={() => handlePhantomPage("Join Room (WIP)", "/join")}
            dataTestId="dev-menu-join-btn"
        >
            Join Room (WIP)
        </StyledButton>

        <StyledButton
            variant="menu"
            on:click={() =>
                handlePhantomPage("Local Game Comp (WIP)", "/local")}
            dataTestId="dev-menu-local-comp-btn"
        >
            Local Game Comp (WIP)
        </StyledButton>

        <StyledButton
            variant="menu"
            on:click={() =>
                handlePhantomPage("Waiting Screen (WIP)", "/waiting")}
            dataTestId="dev-menu-waiting-btn"
        >
            Waiting Screen (WIP)
        </StyledButton>

        <hr class="divider-h" />

        <!-- Standard Game Modes -->
        <StyledButton
            variant="menu"
            on:click={() => {
                onPlayVsComputer();
                onClose();
            }}
            dataTestId="training-btn">{$_("mainMenu.training")}</StyledButton
        >
        <StyledButton
            variant="menu"
            on:click={handleTimedGame}
            dataTestId="timed-game-btn">{$_("mainMenu.timedGame")}</StyledButton
        >
        <StyledButton
            variant="menu"
            on:click={() => {
                onLocalGame();
                onClose();
            }}
            dataTestId="local-game-btn">{$_("mainMenu.localGame")}</StyledButton
        >
        <StyledButton
            variant="menu"
            on:click={handleOnlineGame}
            dataTestId="online-game-btn"
            >{$_("mainMenu.playOnline")}</StyledButton
        >
    </div>
</div>

<style>
    .dev-menu-content {
        display: flex;
        flex-direction: column;
        gap: 20px;
        width: 100%;
        box-sizing: border-box;
    }

    .modal-title-menu {
        text-align: center;
        font-size: 1.8em;
        font-weight: 800;
        color: #fff;
        margin: 0;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }

    .actions-column {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .divider-h {
        border: none;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        margin: 8px 0;
    }
</style>
