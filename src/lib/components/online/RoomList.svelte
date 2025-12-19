<script lang="ts">
    import { onMount } from "svelte";
    import { roomService } from "$lib/services/roomService";
    import type { RoomSummary } from "$lib/types/online";
    import { _ } from "svelte-i18n";
    import StyledButton from "$lib/components/ui/StyledButton.svelte";
    import SvgIcons from "$lib/components/SvgIcons.svelte";
    import { goto } from "$app/navigation";
    import { base } from "$app/paths";
    import { logService } from "$lib/services/logService";

    let rooms: RoomSummary[] = [];
    let isLoading = false;
    let joiningRoomId: string | null = null;
    let error: string | null = null;

    async function loadRooms() {
        isLoading = true;
        error = null;
        try {
            rooms = await roomService.getPublicRooms();
        } catch (e) {
            console.error(e);
            error = $_("onlineMenu.errors.fetchFailed");
        } finally {
            isLoading = false;
        }
    }

    async function handleJoin(roomId: string) {
        logService.action(`[RoomList] Clicked Join for room: ${roomId}`);

        if (joiningRoomId) return;
        joiningRoomId = roomId;

        const playerName = localStorage.getItem("online_playerName");
        if (!playerName) {
            localStorage.setItem(
                "online_playerName",
                `Player ${Math.floor(Math.random() * 1000)}`,
            );
            logService.init(`[RoomList] Generated new player name`);
        }

        try {
            const myName = localStorage.getItem("online_playerName")!;
            logService.init(`[RoomList] Calling roomService.joinRoom...`);

            await roomService.joinRoom(roomId, myName);

            logService.init(
                `[RoomList] Joined successfully. Navigating to lobby...`,
            );
            goto(`${base}/online/lobby/${roomId}`);
        } catch (e) {
            logService.error("[RoomList] Failed to join room", e);
            alert($_("onlineMenu.errors.joinFailed"));
            loadRooms();
        } finally {
            joiningRoomId = null;
        }
    }

    onMount(() => {
        loadRooms();
        const interval = setInterval(loadRooms, 10000);
        return () => clearInterval(interval);
    });
</script>

<div class="room-list-container" data-testid="room-list-container">
    <div class="list-header">
        <h3 data-testid="room-list-title">{$_("onlineMenu.title")}</h3>
        <button
            class="refresh-btn"
            on:click={loadRooms}
            disabled={isLoading}
            aria-label={$_("onlineMenu.refresh")}
            data-testid="refresh-rooms-btn"
        >
            <span class:spinning={isLoading}>
                <SvgIcons name="clear-cache" />
            </span>
        </button>
    </div>

    {#if error}
        <div class="error-message" data-testid="room-list-error">{error}</div>
    {/if}

    <div class="rooms-table-wrapper">
        <table class="rooms-table" data-testid="rooms-table">
            <thead>
                <tr>
                    <th>{$_("onlineMenu.roomName")}</th>
                    <th>{$_("onlineMenu.status")}</th>
                    <th>{$_("onlineMenu.players")}</th>
                    <th>{$_("onlineMenu.action")}</th>
                </tr>
            </thead>
            <tbody>
                {#if rooms.length === 0 && !isLoading}
                    <tr>
                        <td
                            colspan="4"
                            class="empty-message"
                            data-testid="no-rooms-message"
                            >{$_("onlineMenu.noRooms")}</td
                        >
                    </tr>
                {:else}
                    {#each rooms as room (room.id)}
                        <tr
                            class="room-row"
                            data-testid={`room-row-${room.id}`}
                        >
                            <td class="room-name">{room.name}</td>
                            <td>
                                <span class="status-badge {room.status}">
                                    {$_(`onlineMenu.${room.status}`)}
                                </span>
                            </td>
                            <td>{room.playerCount} / {room.maxPlayers}</td>
                            <td>
                                {#if room.status === "waiting" && room.playerCount < room.maxPlayers}
                                    <StyledButton
                                        size="small"
                                        variant="primary"
                                        on:click={() => handleJoin(room.id)}
                                        disabled={!!joiningRoomId}
                                        dataTestId={`join-room-btn-${room.id}`}
                                    >
                                        {#if joiningRoomId === room.id}
                                            {$_("common.loading")}
                                        {:else}
                                            {$_("onlineMenu.join")}
                                        {/if}
                                    </StyledButton>
                                {:else}
                                    <span class="full-text">-</span>
                                {/if}
                            </td>
                        </tr>
                    {/each}
                {/if}
            </tbody>
        </table>
    </div>
</div>

<style>
    .room-list-container {
        background: var(--bg-secondary);
        border-radius: var(--unified-border-radius);
        border: var(--unified-border);
        padding: 16px;
        box-shadow: var(--unified-shadow);
        width: 100%;
        max-width: 800px;
        margin: 0 auto;
        /* FIX: Додано box-sizing */
        box-sizing: border-box;
    }

    .list-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
    }

    .list-header h3 {
        margin: 0;
        color: var(--text-primary);
    }

    .refresh-btn {
        background: none;
        border: none;
        color: var(--text-secondary);
        cursor: pointer;
        padding: 8px;
        border-radius: 50%;
        transition: background 0.2s;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .refresh-btn:hover {
        background: var(--bg-primary);
        color: var(--text-primary);
    }

    .spinning {
        animation: spin 1s linear infinite;
        display: block;
        width: 24px;
        height: 24px;
    }

    @keyframes spin {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }

    .rooms-table-wrapper {
        overflow-x: auto;
        /* FIX: Додано для плавної прокрутки на мобільних */
        -webkit-overflow-scrolling: touch;
    }

    .rooms-table {
        width: 100%;
        border-collapse: collapse;
        color: var(--text-primary);
        /* FIX: Мінімальна ширина для таблиці, щоб не стискалася занадто сильно */
        min-width: 400px;
    }

    .rooms-table th {
        text-align: left;
        padding: 12px;
        border-bottom: 2px solid var(--border-color);
        color: var(--text-secondary);
        font-weight: 600;
    }

    .rooms-table td {
        padding: 12px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .room-row:hover {
        background-color: rgba(255, 255, 255, 0.05);
    }

    .room-name {
        font-weight: bold;
        color: var(--text-accent);
    }

    .status-badge {
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 0.85em;
        font-weight: bold;
        text-transform: uppercase;
    }

    .status-badge.waiting {
        background-color: rgba(76, 175, 80, 0.2);
        color: #4caf50;
    }

    .status-badge.playing {
        background-color: rgba(33, 150, 243, 0.2);
        color: #2196f3;
    }

    .status-badge.finished {
        background-color: rgba(158, 158, 158, 0.2);
        color: #9e9e9e;
    }

    .empty-message {
        text-align: center;
        padding: 32px;
        color: var(--text-secondary);
        font-style: italic;
    }

    .error-message {
        color: var(--error-color);
        text-align: center;
        margin-bottom: 16px;
        padding: 8px;
        background: rgba(244, 67, 54, 0.1);
        border-radius: 8px;
    }

    .full-text {
        color: var(--text-secondary);
        font-size: 0.9em;
    }
</style>
