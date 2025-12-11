<script lang="ts">
    import { _ } from "svelte-i18n";
    import { goto } from "$app/navigation";
    import { base } from "$app/paths";
    import { uiStateStore } from "$lib/stores/uiStateStore.js";
    import { logService } from "$lib/services/logService.js";
    import StyledButton from "$lib/components/ui/StyledButton.svelte";

    export let onClose: () => void;
    export let onOpenWipNotice: () => void;
    export let onPlayVsComputer: () => void;
    export let onLocalGame: () => void;
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
    }

    function handleOnlineGame() {
        uiStateStore.update((s) => ({ ...s, intendedGameType: "online" }));
        navigateTo("/online");
        onClose();
    }
</script>

<div
    class="dev-menu"
    data-testid="dev-menu"
    role="dialog"
    tabindex="0"
    onclick={(e) => {
        e.stopPropagation();
    }}
    onkeydown={(e) => e.key === "Escape" && onClose()}
>
    <h3>dev v.{versionNumber}</h3>

    <!-- Test Pages -->
    <StyledButton
        variant="menu"
        class="secondary"
        on:click={handleDevMenuBtn}
        dataTestId="dev-menu-dnd-btn"
    >
        {$_("mainMenu.dragAndDropTest")}
    </StyledButton>

    <StyledButton
        variant="menu"
        class="secondary"
        on:click={() =>
            handlePhantomPage("Button Styles Test", "/test/buttons")}
        dataTestId="dev-menu-buttons-test-btn"
    >
        Button Styles Test
    </StyledButton>

    <StyledButton
        variant="menu"
        class="secondary"
        on:click={() => navigateTo("/test-main-menu")}
        dataTestId="dev-menu-test-main-menu-btn">Test Main Menu</StyledButton
    >

    <!-- Phantom / WIP Pages -->
    <StyledButton
        variant="menu"
        class="secondary"
        on:click={() => handlePhantomPage("Join Room (WIP)", "/join")}
        dataTestId="dev-menu-join-btn"
    >
        Join Room (WIP)
    </StyledButton>

    <StyledButton
        variant="menu"
        class="secondary"
        on:click={() => handlePhantomPage("Local Game Comp (WIP)", "/local")}
        dataTestId="dev-menu-local-comp-btn"
    >
        Local Game Comp (WIP)
    </StyledButton>

    <StyledButton
        variant="menu"
        class="secondary"
        on:click={() => handlePhantomPage("Waiting Screen (WIP)", "/waiting")}
        dataTestId="dev-menu-waiting-btn"
    >
        Waiting Screen (WIP)
    </StyledButton>

    <hr
        style="width: 100%; border: 0; border-top: 1px solid #444; margin: 8px 0;"
    />

    <!-- Standard Game Modes -->
    <StyledButton
        variant="menu"
        class="secondary"
        on:click={onPlayVsComputer}
        dataTestId="training-btn">{$_("mainMenu.training")}</StyledButton
    >
    <StyledButton
        variant="menu"
        class="secondary"
        on:click={handleTimedGame}
        dataTestId="timed-game-btn">{$_("mainMenu.timedGame")}</StyledButton
    >
    <StyledButton
        variant="menu"
        class="secondary"
        on:click={onLocalGame}
        dataTestId="local-game-btn">{$_("mainMenu.localGame")}</StyledButton
    >
    <StyledButton
        variant="menu"
        class="secondary"
        on:click={handleOnlineGame}
        dataTestId="online-game-btn">{$_("mainMenu.playOnline")}</StyledButton
    >
</div>
