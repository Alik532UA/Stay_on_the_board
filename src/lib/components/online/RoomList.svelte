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
    import { fade, fly } from "svelte/transition";
    import { flip } from "svelte/animate";

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
                <SvgIcons name="clear-cache" />
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
                    <!-- Fallback or use another if search not avail. using search for now as placeholder if fails visual is ok -->
                </div>
                <p data-testid="no-rooms-message">{$_("onlineMenu.noRooms")}</p>
            </div>
        {:else}
            {#each rooms as room (room.id)}
                <div
                    class="room-card"
                    animate:flip={{ duration: 400 }}
                    in:fly={{ y: 20, duration: 400 }}
                    data-testid={`room-row-${room.id}`}
                >
                    <div class="card-header">
                        <span class="room-name">{room.name}</span>
                        <span class="status-badge {room.status}">
                            {$_(`onlineMenu.${room.status}`)}
                        </span>
                    </div>

                    <div class="card-body">
                        <div class="col">
                            <span class="info-label"
                                >{$_("onlineMenu.players")}</span
                            >
                            <div class="players-info">
                                <span class="count-text"
                                    >{room.playerCount} / {room.maxPlayers}</span
                                >
                                <div class="progress-bar">
                                    <div
                                        class="progress-fill"
                                        style="width: {(room.playerCount /
                                            room.maxPlayers) *
                                            100}%"
                                        class:full={room.playerCount >=
                                            room.maxPlayers}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="card-actions">
                        {#if room.status === "waiting" && room.playerCount < room.maxPlayers}
                            <StyledButton
                                size="medium"
                                variant="primary"
                                on:click={() => handleJoin(room.id)}
                                disabled={!!joiningRoomId}
                                dataTestId={`join-room-btn-${room.id}`}
                                class="full-width-btn"
                            >
                                {#if joiningRoomId === room.id}
                                    {$_("common.loading")}
                                {:else}
                                    {$_("onlineMenu.join")}
                                {/if}
                            </StyledButton>
                        {:else}
                            <div class="spectate-placeholder">
                                {$_("onlineMenu.status") === "Full" ||
                                room.playerCount >= room.maxPlayers
                                    ? "Full"
                                    : "-"}
                            </div>
                        {/if}
                    </div>
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

    /* Modern Refresh Button */
    .refresh-btn {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: var(--text-primary);
        cursor: pointer;
        padding: 8px 16px;
        border-radius: 12px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        align-items: center;
        gap: 8px;
        backdrop-filter: blur(8px);
        font-weight: 600;
        min-height: 40px;
    }

    .refresh-btn:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        border-color: var(--text-accent);
    }

    .refresh-btn:active {
        transform: translateY(0);
    }

    .refresh-btn .icon-wrapper {
        width: 20px;
        height: 20px;
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

    /* Grid Layout */
    .rooms-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 16px;
        width: 100%;
    }

    /* Room Card */
    .room-card {
        background: linear-gradient(
            145deg,
            rgba(255, 255, 255, 0.05) 0%,
            rgba(255, 255, 255, 0.02) 100%
        );
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 16px;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 16px;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
    }

    .room-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
        border-color: rgba(255, 255, 255, 0.2);
        background: linear-gradient(
            145deg,
            rgba(255, 255, 255, 0.08) 0%,
            rgba(255, 255, 255, 0.04) 100%
        );
    }

    .card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 8px;
    }

    .room-name {
        font-size: 1.1rem;
        font-weight: 700;
        color: var(--text-primary);
        line-height: 1.3;
        word-break: break-word;
    }

    .status-badge {
        font-size: 0.75rem;
        text-transform: uppercase;
        padding: 4px 8px;
        border-radius: 6px;
        font-weight: 800;
        letter-spacing: 0.5px;
        white-space: nowrap;
    }

    .status-badge.waiting {
        background: rgba(76, 175, 80, 0.2);
        color: #66bb6a;
        border: 1px solid rgba(76, 175, 80, 0.3);
    }

    .status-badge.playing {
        background: rgba(33, 150, 243, 0.2);
        color: #42a5f5;
        border: 1px solid rgba(33, 150, 243, 0.3);
    }

    .status-badge.finished {
        background: rgba(158, 158, 158, 0.2);
        color: #bdbdbd;
    }

    /* Card Body */
    .card-body {
        flex: 1;
    }

    .col {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .info-label {
        font-size: 0.8rem;
        color: var(--text-secondary);
        font-weight: 600;
        text-transform: uppercase;
    }

    .players-info {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .count-text {
        font-size: 0.9rem;
        font-weight: 700;
        color: var(--text-primary);
    }

    .progress-bar {
        height: 6px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 3px;
        overflow: hidden;
        width: 100%;
    }

    .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #4caf50, #81c784);
        border-radius: 3px;
        transition: width 0.5s ease;
    }

    .progress-fill.full {
        background: linear-gradient(90deg, #f44336, #e57373);
    }

    /* Actions */
    .card-actions {
        margin-top: auto;
    }

    :global(.full-width-btn) {
        width: 100%;
        display: flex !important;
        justify-content: center;
    }

    .spectate-placeholder {
        text-align: center;
        padding: 10px;
        color: var(--text-secondary);
        font-weight: 600;
        font-size: 0.9rem;
        background: rgba(0, 0, 0, 0.2);
        border-radius: 8px;
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
