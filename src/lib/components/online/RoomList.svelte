<script lang="ts">
    import { onMount } from "svelte";
    import { roomService } from "$lib/services/roomService";
    import type { RoomSummary } from "$lib/types/online";
    import { _, locale } from "svelte-i18n";
    import SvgIcons from "$lib/components/SvgIcons.svelte";
    import { goto } from "$app/navigation";
    import { base } from "$app/paths";
    import { logService } from "$lib/services/logService";
    import { fade, fly } from "svelte/transition";
    import { flip } from "svelte/animate";
    import RoomCard from "./RoomCard.svelte";
    import { formatDateTime } from "$lib/utils/dateUtils";

    let rooms: RoomSummary[] = [];
    let latestCreatedAt: number | undefined;
    let isLoading = false;
    let joiningRoomId: string | null = null;
    let error: string | null = null;
    let unsubscribe: (() => void) | undefined;

    function subscribe() {
        if (unsubscribe) unsubscribe();
        
        isLoading = true;
        error = null;
        
        try {
            unsubscribe = roomService.subscribeToPublicRooms((data) => {
                rooms = data.rooms;
                latestCreatedAt = data.latestCreatedAt;
                isLoading = false;
            });
        } catch (e) {
            console.error(e);
            error = $_("onlineMenu.errors.fetchFailed");
            isLoading = false;
        }
    }

    // Зберігаємо для сумісності з кнопкою, хоча оновлення автоматичне
    function loadRooms() {
        subscribe();
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
            // loadRooms(); // Не потрібно, бо підписка сама оновить список
        } finally {
            joiningRoomId = null;
        }
    }

    onMount(() => {
        subscribe();
        return () => {
            if (unsubscribe) unsubscribe();
        };
    });
</script>

<div class="room-list-container" data-testid="room-list-container">
    <div class="list-header">
        <div class="title-group">
            <h3 data-testid="room-list-title">{$_("onlineMenu.title")}</h3>
            <span class="room-count">
                {rooms.length}
                {rooms.length === 1 ? "room" : "rooms"}
            </span>
        </div>

        <button
            class="refresh-btn"
            class:loading={isLoading}
            on:click={loadRooms}
            disabled={isLoading}
            aria-label={$_("onlineMenu.refresh")}
            data-testid="refresh-rooms-btn"
        >
            <div class="icon-wrapper">
                <SvgIcons name="clear-cache" width="20" height="20" />
            </div>
            <span class="btn-text">{$_("onlineMenu.refresh")}</span>
        </button>
    </div>

    {#if error}
        <div
            class="error-message"
            transition:fade
            data-testid="room-list-error"
        >
            <div class="error-icon">!</div>
            {error}
        </div>
    {/if}

    <div class="rooms-grid" data-testid="rooms-table">
        {#if rooms.length === 0 && !isLoading}
            <div class="empty-state" in:fade>
                <div class="empty-icon-wrapper">
                    <SvgIcons name="no-moves" />
                </div>
                <p
                    data-testid="no-rooms-message"
                    style="white-space: pre-line;"
                >
                    {$_("onlineMenu.noRooms", {
                        values: {
                            lastInfo: latestCreatedAt
                                ? "\n" +
                                  $_("onlineMenu.lastRoomTime", {
                                      values: {
                                          time: formatDateTime(
                                              latestCreatedAt,
                                              $locale,
                                          ),
                                      },
                                  })
                                : $_("onlineMenu.createFirst"),
                        },
                    })}
                </p>
            </div>
        {:else}
            {#each rooms as room (room.id)}
                <div
                    animate:flip={{ duration: 400 }}
                    in:fly={{ y: 20, duration: 400 }}
                >
                    <RoomCard
                        {room}
                        {joiningRoomId}
                        on:join={(e) => handleJoin(e.detail)}
                    />
                </div>
            {/each}
        {/if}
    </div>
</div>

<style>
    .room-list-container {
        width: 100%;
        box-sizing: border-box;
    }

    .list-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
        padding: 0 4px;
    }

    .title-group {
        display: flex;
        align-items: baseline;
        gap: 12px;
    }

    .list-header h3 {
        margin: 0;
        font-size: 1.5rem;
        color: var(--text-primary);
        font-weight: 800;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .room-count {
        color: var(--text-secondary);
        font-size: 0.9rem;
        font-weight: 600;
    }

    .refresh-btn {
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: var(--text-primary);
        cursor: pointer;
        padding: 8px 16px;
        border-radius: 12px;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
        font-size: 0.9rem;
        height: 40px;
    }

    .refresh-btn:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.15);
        border-color: var(--text-accent);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .refresh-btn:active:not(:disabled) {
        transform: translateY(0);
    }

    .refresh-btn:disabled {
        opacity: 0.6;
        cursor: wait;
    }

    .refresh-btn .icon-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.5s ease;
    }

    .refresh-btn.loading .icon-wrapper {
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }

    .rooms-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 16px;
        width: 100%;
    }

    .error-message {
        background: rgba(244, 67, 54, 0.15);
        border: 1px solid rgba(244, 67, 54, 0.3);
        color: #ef9a9a;
        padding: 12px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 24px;
    }

    .empty-state {
        grid-column: 1 / -1;
        text-align: center;
        padding: 48px;
        color: var(--text-secondary);
        background: rgba(255, 255, 255, 0.02);
        border-radius: 16px;
        border: 2px dashed rgba(255, 255, 255, 0.1);
    }
</style>
