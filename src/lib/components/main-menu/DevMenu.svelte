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

    function handleTimedGame() {
        // NOTE: Original MainMenu logic for timed game:
        // onclick={() => {
        //   uiStateStore.update((s) => ({ ...s, intendedGameType: "timed" }));
        //   navigateTo("/game/timed");
        // }}
        uiStateStore.update((s) => ({ ...s, intendedGameType: "timed" }));
        navigateTo("/game/timed");
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
        on:click={() => navigateTo("/test-main-menu")}
        dataTestId="dev-menu-test-main-menu-btn">Test Main Menu</StyledButton
    >
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
        disabled={!import.meta.env.DEV}
        on:click={import.meta.env.DEV ? onLocalGame : onOpenWipNotice}
        dataTestId="local-game-btn">{$_("mainMenu.localGame")}</StyledButton
    >
    <StyledButton
        variant="menu"
        class="secondary"
        disabled={true}
        on:click={onOpenWipNotice}
        dataTestId="online-game-btn">{$_("mainMenu.playOnline")}</StyledButton
    >
</div>
