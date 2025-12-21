<script lang="ts">
    import { _ } from "svelte-i18n";
    import StyledButton from "$lib/components/ui/StyledButton.svelte";
    import SvgIcons from "$lib/components/SvgIcons.svelte";
    import { createEventDispatcher } from "svelte";

    export let amIHost: boolean;
    export let isMyPlayerReady: boolean = false; // Default false to be safe
    export let allReady: boolean;
    export let roomStatus: "waiting" | "playing" | "finished";

    const dispatch = createEventDispatcher();

    function onToggleReady() {
        dispatch("toggleReady");
    }

    function onStartGame() {
        dispatch("startGame");
    }
</script>

<div class="actions-footer">
    <StyledButton
        variant={isMyPlayerReady ? "default" : "primary"}
        size="large"
        on:click={onToggleReady}
        dataTestId="toggle-ready-btn"
        class="action-btn ready-btn"
        disabled={roomStatus !== "waiting"}
    >
        {#if isMyPlayerReady}
            {$_("onlineMenu.lobby.notReady")}
        {:else}
            {$_("onlineMenu.lobby.ready")}
        {/if}
    </StyledButton>

    {#if amIHost}
        <!-- Separator -->
        <div class="separator"></div>

        <StyledButton
            variant="primary"
            size="large"
            disabled={!allReady}
            on:click={onStartGame}
            dataTestId="start-game-btn"
            class="action-btn start-btn"
        >
            <span class="btn-content">
                <SvgIcons
                    name="boxing-glove-pictogram-1"
                    width="20"
                    height="20"
                />
                {$_("onlineMenu.lobby.startGame")}
            </span>
        </StyledButton>
    {/if}
</div>

<style>
    .actions-footer {
        padding: 24px;
        border-top: 1px solid rgba(255, 255, 255, 0.05);
        display: flex;
        flex-direction: column;
        gap: 16px;
        background: rgba(0, 0, 0, 0.1);
    }

    .separator {
        height: 1px;
        background: rgba(255, 255, 255, 0.05);
        width: 100%;
    }

    /* Global needed for StyledButton class prop to work effectively for width */
    :global(.action-btn) {
        width: 100%;
        justify-content: center;
    }

    .btn-content {
        display: flex;
        align-items: center;
        gap: 8px;
    }
</style>
