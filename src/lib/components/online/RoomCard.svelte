<script lang="ts">
    import { _ } from "svelte-i18n";
    import StyledButton from "$lib/components/ui/StyledButton.svelte";
    import type { RoomSummary } from "$lib/types/online";
    import { createEventDispatcher } from "svelte";

    export let room: RoomSummary;
    export let joiningRoomId: string | null;

    const dispatch = createEventDispatcher();

    function onJoin() {
        dispatch("join", room.id);
    }
</script>

<div class="room-card" data-testid={`room-row-${room.id}`}>
    <div class="card-header">
        <span class="room-name">{room.name}</span>
        <span class="status-badge {room.status}">
            {$_(`onlineMenu.${room.status}`)}
        </span>
    </div>

    <div class="card-body">
        <div class="col">
            <span class="info-label">{$_("onlineMenu.players")}</span>
            <div class="players-info">
                <span class="count-text"
                    >{room.playerCount} / {room.maxPlayers}</span
                >
                <div class="progress-bar">
                    <div
                        class="progress-fill"
                        style="width: {(room.playerCount / room.maxPlayers) *
                            100}%"
                        class:full={room.playerCount >= room.maxPlayers}
                    ></div>
                </div>
            </div>
        </div>
    </div>

    <div class="card-actions">
        {#if room.status === "waiting" && room.playerCount < room.maxPlayers}
            <!-- FIX: Змінено size="medium" на size="default" -->
            <StyledButton
                size="default"
                variant="primary"
                on:click={onJoin}
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

<style>
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
</style>
