<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { roomService } from "$lib/services/roomService";
    import type { Room, OnlinePlayer } from "$lib/types/online";
    import { _ } from "svelte-i18n";
    import FloatingBackButton from "$lib/components/FloatingBackButton.svelte";
    import LobbyHeader from "./lobby/LobbyHeader.svelte";
    import LobbyPlayerList from "./lobby/LobbyPlayerList.svelte";
    import LobbySettings from "./lobby/LobbySettings.svelte";
    import ChatWidget from "./ChatWidget.svelte";
    import { goto, beforeNavigate } from "$app/navigation";
    import { base } from "$app/paths";
    import type { Unsubscribe } from "firebase/firestore";
    import type { GameSettingsState } from "$lib/stores/gameSettingsStore";
    import { fly, fade } from "svelte/transition";

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

    $: myPlayer = room && myPlayerId ? room.players[myPlayerId] : null;

    $: amIHost = room && myPlayerId ? room.hostId === myPlayerId : false;
    $: canEditSettings = amIHost || (room && room.allowGuestSettings);
    $: myName = myPlayer ? myPlayer.name : "Player";
</script>

<div class="lobby-page" data-testid="lobby-container">
    <FloatingBackButton on:click={handleLeave} />

    {#if room && myPlayerId}
        <div class="lobby-content" in:fade={{ duration: 300 }}>
            <div class="lobby-grid">
                <!-- Ліва колонка: Хедер та Налаштування -->
                <div
                    class="column left-column"
                    in:fly={{ y: 20, duration: 400, delay: 100 }}
                >
                    <LobbyHeader {room} {roomId} {amIHost} />

                    <LobbySettings
                        {room}
                        {canEditSettings}
                        {amIHost}
                        onUpdateSetting={handleUpdateSetting}
                        onUpdateRoomSetting={handleUpdateRoomSetting}
                    />
                </div>

                <!-- Права колонка: Гравці -->
                <div
                    class="column right-column"
                    in:fly={{ y: 20, duration: 400, delay: 200 }}
                >
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
            </div>

            <!-- Floating Chat Widget -->
            <ChatWidget
                {roomId}
                playerId={myPlayerId}
                playerName={myName}
                playerColor={myPlayer?.color || "#ffd700"}
            />
        </div>
    {:else}
        <div class="loading-state" data-testid="lobby-loading">
            <div class="spinner"></div>
            <p>{$_("common.loading")}</p>
        </div>
    {/if}
</div>

<style>
    .lobby-page {
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
        min-height: 100vh;
        color: var(--text-primary);
        box-sizing: border-box;
        width: 100%;
        display: flex;
        flex-direction: column;
    }

    .lobby-content {
        width: 100%;
        margin-top: 40px;
    }

    .lobby-grid {
        display: grid;
        grid-template-columns: 0.8fr 1.2fr; /* Sidebar Left, Main Right */
        gap: 24px;
        width: 100%;
        align-items: start; /* Align to top */
    }

    .column {
        display: flex;
        flex-direction: column;
        gap: 24px;
        min-width: 0;
    }

    /* Removed chat-wrapper styles since chat is now floating */

    .loading-state {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 16px;
        color: var(--text-secondary);
    }

    .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid rgba(255, 255, 255, 0.1);
        border-top-color: var(--text-accent);
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    @media (max-width: 900px) {
        .lobby-grid {
            grid-template-columns: 1fr;
        }

        .lobby-page {
            padding: 16px;
        }

        .lobby-content {
            margin-top: 60px; /* Space for fixed back button */
        }
    }
</style>
