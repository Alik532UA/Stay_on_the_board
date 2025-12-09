<script lang="ts">
    import { _ } from "svelte-i18n";
    import { goto } from "$app/navigation";
    import { base } from "$app/paths";
    import { uiStateStore } from "$lib/stores/uiStateStore.js";
    import { logService } from "$lib/services/logService.js";

    export let onClose: () => void;
    export let onOpenWipNotice: () => void;
    export let onPlayVsComputer: () => void;
    export let onLocalGame: () => void;

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
    <h3>dev</h3>
    <button
        class="modal-button secondary"
        onclick={handleDevMenuBtn}
        data-testid="dev-menu-dnd-btn"
    >
        {$_("mainMenu.dragAndDropTest")}
    </button>
    <button
        class="modal-button secondary"
        onclick={() => navigateTo("/test-main-menu")}
        data-testid="dev-menu-test-main-menu-btn">Test Main Menu</button
    >
    <button
        class="modal-button secondary"
        onclick={onPlayVsComputer}
        data-testid="training-btn">{$_("mainMenu.training")}</button
    >
    <button
        class="modal-button secondary"
        onclick={handleTimedGame}
        data-testid="timed-game-btn">{$_("mainMenu.timedGame")}</button
    >
    <button
        class="modal-button secondary"
        class:pseudo-disabled={!import.meta.env.DEV}
        onclick={import.meta.env.DEV ? onLocalGame : onOpenWipNotice}
        data-testid="local-game-btn">{$_("mainMenu.localGame")}</button
    >
    <button
        class="modal-button secondary pseudo-disabled"
        onclick={onOpenWipNotice}
        data-testid="online-game-btn">{$_("mainMenu.playOnline")}</button
    >
</div>
