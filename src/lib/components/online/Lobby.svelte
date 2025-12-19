<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { roomService } from "$lib/services/roomService";
    import type { Room, OnlinePlayer } from "$lib/types/online";
    import { _ } from "svelte-i18n";
    import FloatingBackButton from "$lib/components/FloatingBackButton.svelte";
    import LobbyChat from "./LobbyChat.svelte";
    import LobbyHeader from "./lobby/LobbyHeader.svelte";
    import LobbyPlayerList from "./lobby/LobbyPlayerList.svelte";
    import LobbySettings from "./lobby/LobbySettings.svelte";
    import { goto, beforeNavigate } from "$app/navigation";
    import { base } from "$app/paths";
    import type { Unsubscribe } from "firebase/firestore";
    import type { GameSettingsState } from "$lib/stores/gameSettingsStore";

    export let roomId: string;

    let room: Room | null = null;
    let myPlayerId: string | null = null;
    let unsubscribe: Unsubscribe | null = null;
    let isLeaving = false;

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

    beforeNavigate(async ({ to, cancel }) => {
        if (to?.route.id === "/game/online") return;
        if (isLeaving) return;

        if (myPlayerId && roomId) {
            isLeaving = true;
            roomService.leaveRoom(roomId, myPlayerId);
        }
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
        isLeaving = true;
        await roomService.leaveRoom(roomId, myPlayerId);
        goto(`${base}/online`);
    }

    function handleUpdatePlayer(data: Partial<OnlinePlayer>) {
        if (!room || !myPlayerId) return;
        roomService.updatePlayer(roomId, myPlayerId, data);
        if (data.name) {
            localStorage.setItem("online_playerName", data.name);
        }
    }

    function handleUpdateSetting(key: keyof GameSettingsState, value: any) {
        if (!room) return;
        roomService.updateRoomSettings(roomId, { [key]: value });
    }

    function handleUpdateRoomSetting(key: string, value: any) {
        if (!room) return;
        roomService.updateRoomSettings(roomId, { [key]: value } as any);
    }

    $: playersList = room
        ? Object.values(room.players).sort((a, b) => a.joinedAt - b.joinedAt)
        : [];

    $: amIHost = room && myPlayerId ? room.hostId === myPlayerId : false;
    $: canEditSettings = amIHost || (room && room.allowGuestSettings);
    $: myName = room && myPlayerId ? room.players[myPlayerId]?.name : "Player";
</script>

<div class="lobby-container" data-testid="lobby-container">
    <FloatingBackButton on:click={handleLeave} />

    {#if room && myPlayerId}
        <div class="lobby-grid">
            <!-- Ліва колонка: Інфо та Гравці -->
            <div class="left-column">
                <LobbyHeader {room} {roomId} {amIHost} />

                <LobbyPlayerList
                    players={playersList}
                    {myPlayerId}
                    hostId={room.hostId}
                    {amIHost}
                    roomStatus={room.status}
                    onUpdatePlayer={handleUpdatePlayer}
                    onToggleReady={toggleReady}
                    onStartGame={handleStartGame}
                />
            </div>

            <!-- Права колонка: Налаштування та Чат -->
            <div class="right-column">
                <LobbySettings
                    {room}
                    {canEditSettings}
                    {amIHost}
                    onUpdateSetting={handleUpdateSetting}
                    onUpdateRoomSetting={handleUpdateRoomSetting}
                />

                <div class="chat-section">
                    <h3>Чат</h3>
                    <LobbyChat
                        {roomId}
                        playerId={myPlayerId}
                        playerName={myName}
                    />
                </div>
            </div>
        </div>
    {:else}
        <div class="loading" data-testid="lobby-loading">
            {$_("common.loading")}
        </div>
    {/if}
</div>

<style>
    .lobby-container {
        max-width: 1000px;
        margin: 0 auto;
        padding: 20px;
        min-height: 100vh;
        color: var(--text-primary);
        /* FIX: Додано box-sizing */
        box-sizing: border-box;
        width: 100%;
    }

    .lobby-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px;
        margin-top: 40px;
        width: 100%;
    }

    .left-column,
    .right-column {
        min-width: 0; /* Запобігає розширенню гріда */
    }

    @media (max-width: 768px) {
        .lobby-grid {
            grid-template-columns: 1fr;
        }
        .lobby-container {
            padding: 10px; /* Зменшено відступи для мобільних */
        }
    }

    .chat-section {
        background: var(--bg-secondary);
        padding: 20px;
        border-radius: var(--unified-border-radius);
        border: var(--unified-border);
        box-shadow: var(--unified-shadow);
        margin-bottom: 20px;
    }

    .loading {
        text-align: center;
        margin-top: 50px;
        font-size: 1.2em;
        color: var(--text-secondary);
    }
</style>
