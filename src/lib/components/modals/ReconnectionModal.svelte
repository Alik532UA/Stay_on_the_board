<script lang="ts">
    import { _ } from "svelte-i18n";
    import { onDestroy, onMount } from "svelte";
    import { roomPlayerService } from "$lib/services/room/roomPlayerService";
    import { navigationService } from "$lib/services/navigationService";

    export let content: {
        playerName: string;
        disconnectStartedAt: number;
        roomId: string;
        myPlayerId: string;
    };

    const TIMEOUT_SECONDS = 30;
    let timeRemaining = TIMEOUT_SECONDS;
    let interval: ReturnType<typeof setInterval>;

    function updateTimer() {
        const elapsed = (Date.now() - content.disconnectStartedAt) / 1000;
        timeRemaining = Math.max(0, Math.ceil(TIMEOUT_SECONDS - elapsed));
    }

    onMount(() => {
        updateTimer();
        interval = setInterval(updateTimer, 500);
    });

    onDestroy(() => {
        if (interval) clearInterval(interval);
    });

    async function leaveGame() {
        await roomPlayerService.leaveRoom(content.roomId, content.myPlayerId);
        navigationService.goTo("/online");
    }
</script>

<div class="reconnection-content" data-testid="reconnection-modal-content">
    <h2 class="modal-title-menu">
        {$_("onlineMenu.waitingForReturn", {
            values: { name: content.playerName },
        })}
    </h2>

    <div class="loader-container">
        <div class="pulse-loader"></div>
    </div>

    <div class="timer">
        {timeRemaining}s
    </div>

    <p class="status-text">
        {$_("onlineMenu.reconnecting")}
    </p>

    <div class="actions-column">
        <button class="leave-btn" on:click={leaveGame}>
            {$_("onlineMenu.leaveRoom")}
        </button>
    </div>
</div>

<style>
    .reconnection-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 20px;
        width: 100%;
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
        width: 100%;
        margin-top: 10px;
    }

    .timer {
        font-size: 3em;
        font-weight: bold;
        color: var(--warning-action-bg);
        font-family: var(--font-family-monospace);
    }

    .timer {
        font-size: 3em;
        font-weight: bold;
        color: var(--warning-action-bg);
        font-family: var(--font-family-monospace);
    }

    .status-text {
        color: var(--text-secondary);
        margin: 0;
    }

    .leave-btn {
        background: transparent;
        border: 2px solid var(--error-color);
        color: var(--error-color);
        padding: 8px 16px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: bold;
        transition: all 0.2s;
    }

    .leave-btn:hover {
        background: var(--error-color);
        color: #fff;
    }

    .pulse-loader {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: var(--time-bar-color, #ffb300);
        opacity: 0.6;
        animation: pulse 1.5s infinite ease-in-out;
    }

    @keyframes pulse {
        0% {
            transform: scale(0.8);
            opacity: 0.6;
        }
        50% {
            transform: scale(1.1);
            opacity: 0.3;
        }
        100% {
            transform: scale(0.8);
            opacity: 0.6;
        }
    }
</style>
