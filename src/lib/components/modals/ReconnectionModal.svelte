<script lang="ts">
    import { t } from "$lib/i18n/typedI18n";
    import { onDestroy, onMount } from "svelte";
    import { roomPlayerService } from "$lib/services/room/roomPlayerService";
    import { navigationService } from "$lib/services/navigationService";
    import { reconnectionStore } from "$lib/stores/reconnectionStore";
    import type { DisconnectedPlayer } from "$lib/stores/reconnectionStore";

    let players: DisconnectedPlayer[] = [];
    let timeRemaining = 0;
    let interval: ReturnType<typeof setInterval>;
    let roomId = "";
    let myPlayerId = "";

    const unsub = reconnectionStore.subscribe((state) => {
        players = state.players;
        roomId = state.roomId;
        myPlayerId = state.myPlayerId;
        updateTimer();
    });

    function updateTimer() {
        if (players.length === 0) {
            timeRemaining = 0;
            return;
        }
        const minDeadline = Math.min(...players.map((p) => p.deadline));
        const now = Date.now();
        timeRemaining = Math.max(0, Math.ceil((minDeadline - now) / 1000));
    }

    onMount(() => {
        interval = setInterval(updateTimer, 500);
        updateTimer();
    });

    onDestroy(() => {
        if (interval) clearInterval(interval);
        unsub();
    });

    async function leaveGame() {
        if (!roomId || !myPlayerId) return;
        await roomPlayerService.leaveRoom(roomId, myPlayerId);
        navigationService.goTo("/online");
    }

    async function kickPlayers() {
        if (!roomId) return;
        // Kick all disconnected players
        for (const p of players) {
            await roomPlayerService.leaveRoom(roomId, p.id);
        }
    }
</script>

<div class="reconnection-content" data-testid="reconnection-modal-content">
    <h2 class="modal-title-menu" data-testid="reconnection-title">
        {$t("onlineMenu.waitingForPlayersList")}
    </h2>

    <div class="players-list" data-testid="reconnection-players-list">
        {#each players as player (player.id)}
            <div
                class="player-item"
                data-testid="reconnection-player-{player.id}"
            >
                <span class="player-name">{player.name}</span>
            </div>
        {/each}
    </div>

    {#if timeRemaining > 0}
        <div class="timer" data-testid="reconnection-timer">
            {timeRemaining}
        </div>
    {/if}

    <div class="loader-container" data-testid="reconnection-loader">
        <div class="pulse-loader"></div>
    </div>

    <div class="actions-column" data-testid="reconnection-actions">
        <button
            class="action-btn kick-btn"
            on:click={kickPlayers}
            disabled={timeRemaining > 0}
            data-testid="reconnection-kick-btn"
        >
            {$t("onlineMenu.kickPlayer")}
        </button>

        <button
            class="action-btn leave-btn"
            on:click={leaveGame}
            data-testid="reconnection-leave-btn"
        >
            {$t("onlineMenu.leaveRoom")}
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

    .players-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
        width: 100%;
        max-height: 150px;
        overflow-y: auto;
    }

    .player-item {
        background: rgba(255, 255, 255, 0.1);
        padding: 10px 15px;
        border-radius: 8px;
        color: #fff;
        font-weight: bold;
        text-align: center;
        border: 1px solid rgba(255, 255, 255, 0.2);
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

    .action-btn {
        width: 100%;
        padding: 12px;
        border-radius: 8px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.2s;
        border: none;
        font-size: 1.1em;
    }

    .action-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        filter: grayscale(1);
    }

    .kick-btn {
        background: var(--warning-color, #ff9800);
        color: white;
    }

    .kick-btn:not(:disabled):hover {
        background: #f57c00;
        transform: scale(1.02);
    }

    .leave-btn {
        background: transparent;
        border: 2px solid var(--error-color);
        color: var(--error-color);
    }

    .leave-btn:not(:disabled):hover {
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

    .loader-container {
        margin: 10px 0;
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
