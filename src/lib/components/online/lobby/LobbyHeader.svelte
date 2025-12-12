<script lang="ts">
    import { _ } from "svelte-i18n";
    import type { Room } from "$lib/types/online";
    import EditableText from "$lib/components/ui/EditableText.svelte";
    import { roomService } from "$lib/services/roomService";
    import { logService } from "$lib/services/logService";
    import { generateRandomRoomName } from "$lib/utils/nameGenerator"; // Оновлений імпорт

    export let room: Room;
    export let roomId: string;
    export let amIHost: boolean = false;

    let isCopied = false;

    function copyRoomId() {
        navigator.clipboard.writeText(roomId);
        isCopied = true;
        setTimeout(() => (isCopied = false), 2000);
    }

    function handleRoomNameChange(e: CustomEvent<string>) {
        const newName = e.detail;
        if (newName && newName !== room.name) {
            logService.action(`[LobbyHeader] Renaming room to: ${newName}`);
            roomService.renameRoom(roomId, newName);
        }
    }
</script>

<div class="lobby-header">
    <div class="room-name-wrapper">
        <EditableText
            value={room.name}
            canEdit={amIHost}
            onRandom={generateRandomRoomName}
            on:change={handleRoomNameChange}
            dataTestId="room-name-editable"
        />
    </div>

    {#if import.meta.env.DEV}
        <div class="room-id-container">
            <span class="room-id" data-testid="room-id-display"
                >ID: {roomId}</span
            >
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
    {/if}

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
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
    }

    .room-name-wrapper {
        font-size: 1.5em;
        margin-bottom: 4px;
        width: 100%;
        display: flex;
        justify-content: center;
    }

    .room-id-container {
        display: flex;
        justify-content: center;
        gap: 10px;
        margin-bottom: 4px;
        color: var(--text-secondary);
        font-family: monospace;
        font-size: 0.9em;
    }
    .copy-btn {
        background: none;
        border: 1px solid var(--border-color);
        border-radius: 4px;
        cursor: pointer;
        color: var(--text-accent);
        font-size: 0.8em;
        padding: 2px 6px;
    }
    .status-badge {
        text-align: center;
        font-weight: bold;
        text-transform: uppercase;
        font-size: 0.9em;
        color: var(--text-accent);
        background: rgba(255, 255, 255, 0.05);
        padding: 4px 12px;
        border-radius: 12px;
    }
</style>
