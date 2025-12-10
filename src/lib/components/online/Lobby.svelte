<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { roomService } from "$lib/services/roomService";
    import type { Room, OnlinePlayer } from "$lib/types/online";
    import { _ } from "svelte-i18n";
    import StyledButton from "$lib/components/ui/StyledButton.svelte";
    import FloatingBackButton from "$lib/components/FloatingBackButton.svelte";
    import { goto } from "$app/navigation";
    import { base } from "$app/paths";
    import { logService } from "$lib/services/logService";
    import type { Unsubscribe } from "firebase/firestore";

    export let roomId: string;

    let room: Room | null = null;
    let myPlayerId: string | null = null;
    let unsubscribe: Unsubscribe | null = null;
    let isCopied = false;

    onMount(() => {
        const session = roomService.getSession();
        myPlayerId = session.playerId;

        if (!myPlayerId) {
            // Якщо немає ID, значить користувач зайшов за посиланням
            // Треба перенаправити на вхід або показати модалку (поки що редірект)
            goto(`${base}/online`);
            return;
        }

        unsubscribe = roomService.subscribeToRoom(roomId, (updatedRoom) => {
            room = updatedRoom;

            // Якщо гра почалася - переходимо на ігровий екран
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

    $: playersList = room ? Object.values(room.players) : [];
    $: amIHost = room && myPlayerId ? room.hostId === myPlayerId : false;
    $: allReady =
        playersList.length === 2 && playersList.every((p) => p.isReady);
</script>

<div class="lobby-container">
    <FloatingBackButton on:click={handleLeave} />

    {#if room}
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
                                        >{$_("onlineMenu.lobby.host")}</span
                                    >
                                {/if}
                                {#if player.id === myPlayerId}
                                    <span class="me-badge"
                                        >({$_("onlineMenu.lobby.you")})</span
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
                            <div class="player-name">
                                {$_("onlineMenu.lobby.waitingForPlayers")}
                            </div>
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
    {:else}
        <div class="loading">{$_("common.loading")}</div>
    {/if}
</div>

<style>
    .lobby-container {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        gap: 24px;
        color: var(--text-primary);
    }

    .lobby-header {
        text-align: center;
        background: var(--bg-secondary);
        padding: 24px;
        border-radius: var(--unified-border-radius);
        border: var(--unified-border);
        box-shadow: var(--unified-shadow);
    }

    .lobby-header h1 {
        margin: 0 0 8px 0;
        font-size: 2em;
    }

    .room-id-container {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        margin-bottom: 12px;
        font-family: monospace;
        color: var(--text-secondary);
    }

    .copy-btn {
        background: none;
        border: 1px solid var(--border-color);
        border-radius: 4px;
        padding: 2px 8px;
        cursor: pointer;
        color: var(--text-accent);
        font-size: 0.8em;
    }

    .players-section {
        flex: 1;
    }

    .players-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .player-card {
        display: flex;
        align-items: center;
        gap: 16px;
        background: var(--bg-secondary);
        padding: 16px;
        border-radius: 12px;
        border: 1px solid var(--border-color);
    }

    .player-card.is-me {
        border-color: var(--text-accent);
        background: rgba(var(--text-accent-rgb), 0.1);
    }

    .player-card.empty {
        opacity: 0.5;
        border-style: dashed;
    }

    .player-avatar {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 1.5em;
        color: #fff;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }

    .player-avatar.placeholder {
        background: var(--control-bg);
        color: var(--text-secondary);
    }

    .player-info {
        flex: 1;
    }

    .player-name {
        font-weight: bold;
        font-size: 1.1em;
        margin-bottom: 4px;
    }

    .host-badge {
        background: #ffd700;
        color: #000;
        font-size: 0.7em;
        padding: 2px 6px;
        border-radius: 4px;
        margin-left: 8px;
        vertical-align: middle;
    }

    .me-badge {
        color: var(--text-secondary);
        font-size: 0.8em;
        font-weight: normal;
        margin-left: 4px;
    }

    .player-status {
        font-size: 0.9em;
        color: var(--error-color);
    }

    .player-status.ready {
        color: var(--positive-score-color);
        font-weight: bold;
    }

    .lobby-actions {
        display: flex;
        gap: 16px;
        justify-content: center;
        padding-top: 20px;
    }

    .loading {
        text-align: center;
        font-size: 1.2em;
        color: var(--text-secondary);
        margin-top: 40px;
    }
</style>
