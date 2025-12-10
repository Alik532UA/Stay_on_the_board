<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { roomService } from "$lib/services/roomService";
    import type { Room } from "$lib/types/online";
    import { _ } from "svelte-i18n";
    import StyledButton from "$lib/components/ui/StyledButton.svelte";
    import FloatingBackButton from "$lib/components/FloatingBackButton.svelte";
    import LobbyChat from "./LobbyChat.svelte";
    import { goto } from "$app/navigation";
    import { base } from "$app/paths";
    import type { Unsubscribe } from "firebase/firestore";
    import ToggleButton from "$lib/components/ToggleButton.svelte";

    export let roomId: string;

    let room: Room | null = null;
    let myPlayerId: string | null = null;
    let unsubscribe: Unsubscribe | null = null;
    let isCopied = false;

    onMount(() => {
        const session = roomService.getSession();
        myPlayerId = session.playerId;

        if (!myPlayerId) {
            goto(`${base}/online`);
            return;
        }

        unsubscribe = roomService.subscribeToRoom(roomId, (updatedRoom) => {
            room = updatedRoom;
            if (room.status === "playing") {
                goto(`${base}/game/online`);
            }
        });
    });

    onDestroy(() => {
        if (unsubscribe) unsubscribe();
    });

    async function toggleReady() {
        if (!room || !myPlayerId) return;
        const me = room.players[myPlayerId];
        await roomService.toggleReady(roomId, myPlayerId, !me.isReady);
    }

    async function handleStartGame() {
        if (!room) return;
        await roomService.startGame(roomId);
    }

    async function handleLeave() {
        if (!myPlayerId) return;
        await roomService.leaveRoom(roomId, myPlayerId);
        goto(`${base}/online`);
    }

    function copyRoomId() {
        navigator.clipboard.writeText(roomId);
        isCopied = true;
        setTimeout(() => (isCopied = false), 2000);
    }

    // Функції для зміни налаштувань (тільки для хоста)
    function updateBoardSize(increment: number) {
        if (!room || !amIHost) return;
        const newSize = room.settings.boardSize + increment;
        if (newSize >= 3 && newSize <= 9) {
            roomService.updateRoomSettings(roomId, { boardSize: newSize });
        }
    }

    function toggleBlockMode() {
        if (!room || !amIHost) return;
        roomService.updateRoomSettings(roomId, {
            blockModeEnabled: !room.settings.blockModeEnabled,
        });
    }

    $: playersList = room ? Object.values(room.players) : [];
    $: amIHost = room && myPlayerId ? room.hostId === myPlayerId : false;
    $: allReady =
        playersList.length === 2 && playersList.every((p) => p.isReady);
    $: myName = room && myPlayerId ? room.players[myPlayerId]?.name : "Player";
</script>

<div class="lobby-container">
    <FloatingBackButton on:click={handleLeave} />

    {#if room}
        <div class="lobby-grid">
            <!-- Ліва колонка: Інфо та Гравці -->
            <div class="left-column">
                <div class="lobby-header">
                    <h1>{room.name}</h1>
                    <div class="room-id-container">
                        <span class="room-id">ID: {roomId}</span>
                        <button class="copy-btn" on:click={copyRoomId}>
                            {isCopied
                                ? $_("onlineMenu.lobby.linkCopied")
                                : $_("onlineMenu.lobby.copyLink")}
                        </button>
                    </div>
                    <div class="status-badge {room.status}">
                        {$_(`onlineMenu.${room.status}`)}
                    </div>
                </div>

                <div class="players-section">
                    <h3>{$_("onlineMenu.players")} ({playersList.length}/2)</h3>
                    <div class="players-list">
                        {#each playersList as player (player.id)}
                            <div
                                class="player-card"
                                class:is-me={player.id === myPlayerId}
                            >
                                <div
                                    class="player-avatar"
                                    style="background-color: {player.color}"
                                >
                                    {player.name[0].toUpperCase()}
                                </div>
                                <div class="player-info">
                                    <div class="player-name">
                                        {player.name}
                                        {#if player.id === room.hostId}
                                            <span class="host-badge"
                                                >{$_(
                                                    "onlineMenu.lobby.host",
                                                )}</span
                                            >
                                        {/if}
                                    </div>
                                    <div
                                        class="player-status"
                                        class:ready={player.isReady}
                                    >
                                        {player.isReady
                                            ? $_("onlineMenu.lobby.ready")
                                            : $_("onlineMenu.lobby.notReady")}
                                    </div>
                                </div>
                            </div>
                        {/each}
                        {#if playersList.length < 2}
                            <div class="player-card empty">
                                <div class="player-avatar placeholder">?</div>
                                <div class="player-info">
                                    {$_("onlineMenu.lobby.waitingForPlayers")}
                                </div>
                            </div>
                        {/if}
                    </div>
                </div>

                <div class="lobby-actions">
                    <StyledButton
                        variant={room.players[myPlayerId || ""]?.isReady
                            ? "default"
                            : "primary"}
                        on:click={toggleReady}
                    >
                        {room.players[myPlayerId || ""]?.isReady
                            ? $_("onlineMenu.lobby.notReady")
                            : $_("onlineMenu.lobby.ready")}
                    </StyledButton>

                    {#if amIHost}
                        <StyledButton
                            variant="primary"
                            disabled={!allReady}
                            on:click={handleStartGame}
                        >
                            {$_("onlineMenu.lobby.startGame")}
                        </StyledButton>
                    {/if}
                </div>
            </div>

            <!-- Права колонка: Налаштування та Чат -->
            <div class="right-column">
                <div class="settings-section">
                    <h3>{$_("settings.title")}</h3>
                    <div class="setting-item">
                        <span>{$_("settings.boardSize")}</span>
                        <div class="size-controls">
                            <button
                                disabled={!amIHost ||
                                    room.settings.boardSize <= 3}
                                on:click={() => updateBoardSize(-1)}>-</button
                            >
                            <span class="size-value"
                                >{room.settings.boardSize}x{room.settings
                                    .boardSize}</span
                            >
                            <button
                                disabled={!amIHost ||
                                    room.settings.boardSize >= 9}
                                on:click={() => updateBoardSize(1)}>+</button
                            >
                        </div>
                    </div>
                    <div class="setting-item">
                        <ToggleButton
                            label={$_("gameControls.blockMode")}
                            checked={room.settings.blockModeEnabled}
                            disabled={!amIHost}
                            on:toggle={toggleBlockMode}
                        />
                    </div>
                    {#if !amIHost}
                        <div class="host-only-hint">
                            {$_("onlineMenu.lobby.hostOnlySettings")}
                        </div>
                    {/if}
                </div>

                <div class="chat-section">
                    <h3>Чат</h3>
                    <LobbyChat
                        {roomId}
                        playerId={myPlayerId || ""}
                        playerName={myName}
                    />
                </div>
            </div>
        </div>
    {:else}
        <div class="loading">{$_("common.loading")}</div>
    {/if}
</div>

<style>
    .lobby-container {
        max-width: 1000px;
        margin: 0 auto;
        padding: 20px;
        min-height: 100vh;
        color: var(--text-primary);
    }

    .lobby-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px;
        margin-top: 40px;
    }

    @media (max-width: 768px) {
        .lobby-grid {
            grid-template-columns: 1fr;
        }
    }

    .lobby-header,
    .players-section,
    .settings-section,
    .chat-section {
        background: var(--bg-secondary);
        padding: 20px;
        border-radius: var(--unified-border-radius);
        border: var(--unified-border);
        box-shadow: var(--unified-shadow);
        margin-bottom: 20px;
    }

    .lobby-header h1 {
        margin: 0 0 8px 0;
        font-size: 1.8em;
        text-align: center;
    }

    .room-id-container {
        display: flex;
        justify-content: center;
        gap: 10px;
        margin-bottom: 10px;
        color: var(--text-secondary);
        font-family: monospace;
    }

    .copy-btn {
        background: none;
        border: 1px solid var(--border-color);
        border-radius: 4px;
        cursor: pointer;
        color: var(--text-accent);
        font-size: 0.8em;
    }

    .status-badge {
        text-align: center;
        font-weight: bold;
        text-transform: uppercase;
        font-size: 0.9em;
        color: var(--text-accent);
    }

    .players-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .player-card {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        background: rgba(0, 0, 0, 0.1);
        border-radius: 12px;
        border: 1px solid transparent;
    }

    .player-card.is-me {
        border-color: var(--text-accent);
        background: rgba(var(--text-accent-rgb), 0.05);
    }

    .player-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        color: #fff;
    }

    .player-avatar.placeholder {
        background: var(--control-bg);
        color: var(--text-secondary);
    }

    .host-badge {
        background: #ffd700;
        color: #000;
        font-size: 0.7em;
        padding: 2px 6px;
        border-radius: 4px;
        margin-left: 6px;
    }

    .player-status.ready {
        color: var(--positive-score-color);
        font-weight: bold;
    }

    .lobby-actions {
        display: flex;
        justify-content: center;
        gap: 16px;
        margin-top: 20px;
    }

    .setting-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
    }

    .size-controls {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .size-controls button {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        border: 1px solid var(--border-color);
        background: var(--control-bg);
        color: var(--text-primary);
        cursor: pointer;
    }

    .size-controls button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .size-value {
        font-weight: bold;
        min-width: 40px;
        text-align: center;
    }

    .host-only-hint {
        font-size: 0.8em;
        color: var(--text-secondary);
        text-align: center;
        font-style: italic;
    }

    .loading {
        text-align: center;
        margin-top: 50px;
        font-size: 1.2em;
        color: var(--text-secondary);
    }
</style>
