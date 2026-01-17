<script lang="ts">
    import { _ } from "svelte-i18n";
    import { onDestroy, onMount } from "svelte";
    import { roomPlayerService } from "$lib/services/room/roomPlayerService";
    import { navigationService } from "$lib/services/navigationService";

    export let content: {
        playerName: string;
        opponentId: string;
        disconnectStartedAt: number;
        roomId: string;
        myPlayerId: string;
    };

    const TIMEOUT_SECONDS = 15; // Змінено на 15 секунд згідно з вимогами
    let timeRemaining = TIMEOUT_SECONDS;
    let interval: ReturnType<typeof setInterval>;
    let startTime: number;

    function updateTimer() {
        if (!startTime) return;
        const elapsed = (Date.now() - startTime) / 1000;
        timeRemaining = Math.max(0, Math.ceil(TIMEOUT_SECONDS - elapsed));
    }

    onMount(() => {
        // ... (код onMount без змін) ...
        if (typeof content.disconnectStartedAt === 'number' && !isNaN(content.disconnectStartedAt) && content.disconnectStartedAt > 0) {
            startTime = content.disconnectStartedAt;
        } else {
            console.warn('[ReconnectionModal] Invalid disconnectStartedAt, using Date.now()', content.disconnectStartedAt);
            startTime = Date.now();
        }

        updateTimer();
        interval = setInterval(updateTimer, 500);
    });
    
    // ... onDestroy ...

    async function leaveGame() {
        await roomPlayerService.leaveRoom(content.roomId, content.myPlayerId);
        navigationService.goTo("/online");
    }

    async function kickPlayer() {
        // Видаляємо опонента з кімнати. Це спровокує логіку "Opponents Left" -> Перемога.
        await roomPlayerService.leaveRoom(content.roomId, content.opponentId);
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
        {#if timeRemaining === 0}
            <button class="kick-btn" on:click={kickPlayer}>
                {$_("onlineMenu.kickPlayer") || "Видалити гравця (Перемога)"}
            </button>
        {/if}
        <button class="leave-btn" on:click={leaveGame}>
            {$_("onlineMenu.leaveRoom")}
        </button>
    </div>
</div>

<style>
    /* ... (стилі без змін) ... */
    .reconnection-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 20px;
        width: 100%;
    }

    /* ... */

    .kick-btn {
        background: var(--primary-color, #4CAF50);
        color: #fff;
        border: none;
        padding: 10px 20px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: bold;
        font-size: 1.1em;
        transition: all 0.2s;
        animation: fadeIn 0.5s ease-in;
    }
    
    .kick-btn:hover {
        background: var(--primary-color-dark, #388E3C);
        transform: scale(1.05);
    }

    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    /* ... (решта стилів) ... */

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
