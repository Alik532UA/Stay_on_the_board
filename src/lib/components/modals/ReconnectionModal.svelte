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

<div class="reconnection-modal">
    <div class="loader-container">
        <div class="pulse-loader"></div>
    </div>

    <h3>
        {$_("onlineMenu.waitingForReturn", {
            values: { name: content.playerName },
        })}
    </h3>

    <div class="timer">
        {timeRemaining}s
    </div>

    <p class="status-text">
        {$_("onlineMenu.reconnecting")}
    </p>

    <div class="actions">
        <button class="leave-btn" on:click={leaveGame}>
            {$_("onlineMenu.leaveRoom")}
        </button>
    </div>
</div>

<style>
    .reconnection-modal {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 16px;
        padding: 20px;
        background: var(--bg-secondary);
        border-radius: var(--unified-border-radius);
        color: var(--text-primary);
    }

    h3 {
        margin: 0;
        font-size: 1.2em;
        font-weight: bold;
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

    .actions {
        margin-top: 10px;
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
