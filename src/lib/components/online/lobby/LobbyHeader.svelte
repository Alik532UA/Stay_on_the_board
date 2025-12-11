<script lang="ts">
    import { _ } from "svelte-i18n";
    import type { Room } from "$lib/types/online";

    export let room: Room;
    export let roomId: string;

    let isCopied = false;

    function copyRoomId() {
        navigator.clipboard.writeText(roomId);
        isCopied = true;
        setTimeout(() => (isCopied = false), 2000);
    }
</script>

<div class="lobby-header">
    <h1 data-testid="room-name">{room.name}</h1>
    <div class="room-id-container">
        <span class="room-id" data-testid="room-id-display">ID: {roomId}</span>
        <button
            class="copy-btn"
            on:click={copyRoomId}
            data-testid="copy-room-id-btn"
        >
            {isCopied
                ? $_("onlineMenu.lobby.linkCopied")
                : $_("onlineMenu.lobby.copyLink")}
        </button>
    </div>
    <div class="status-badge {room.status}" data-testid="room-status-badge">
        {$_(`onlineMenu.${room.status}`)}
    </div>
</div>

<style>
    .lobby-header {
        background: var(--bg-secondary);
        padding: 20px;
        border-radius: var(--unified-border-radius);
        border: var(--unified-border);
        box-shadow: var(--unified-shadow);
        margin-bottom: 20px;
    }
    h1 {
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
</style>
