<script lang="ts">
    import { _ } from "svelte-i18n";
    import type { Room } from "$lib/types/online";
    import EditableText from "$lib/components/ui/EditableText.svelte";
    import { roomService } from "$lib/services/roomService";
    import { logService } from "$lib/services/logService";
    import { generateRandomRoomName } from "$lib/utils/nameGenerator";
    import SvgIcons from "$lib/components/SvgIcons.svelte";
    import { fade } from "svelte/transition";

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
    <div class="top-row">
        <div class="status-badge {room.status}" data-testid="room-status-badge">
            <span class="status-dot"></span>
            {$_(`onlineMenu.${room.status}`)}
        </div>
    </div>

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
        <button
            class="room-id-chip"
            class:copied={isCopied}
            on:click={copyRoomId}
            data-testid="copy-room-id-btn"
            title={$_("onlineMenu.lobby.copyLink")}
        >
            <span class="id-label">ID:</span>
            <span class="id-value">{roomId}</span>
            <div class="icon-wrapper">
                {#if isCopied}
                    <div in:fade={{ duration: 200 }}>
                        <SvgIcons name="confirm" />
                    </div>
                {:else}
                    <div in:fade={{ duration: 200 }}>
                        <SvgIcons name="copy" width="14" height="14" />
                    </div>
                {/if}
            </div>
        </button>
    {/if}
</div>

<style>
    .lobby-header {
        background: rgba(255, 255, 255, 0.03);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        padding: 24px; /* Restored to original */
        border-radius: 20px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        margin-bottom: 0; /* Removing margin since it's now in a flex gap container */
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px; /* Restored to original */
        position: relative;
        overflow: hidden;
    }

    .lobby-header::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.2),
            transparent
        );
    }

    .top-row {
        width: 100%;
        display: flex;
        justify-content: center;
    }

    .room-name-wrapper {
        width: 100%;
        display: flex;
        justify-content: center;
    }

    /* Targeting the EditableText internal style via global */
    .room-name-wrapper :global(input),
    .room-name-wrapper :global(span) {
        font-size: 2rem !important;
        font-weight: 800 !important;
        text-align: center;
        color: var(--text-primary);
        text-shadow: 0 0 20px rgba(var(--primary-rgb, 255, 255, 255), 0.3);
    }

    .room-name-wrapper :global(button) {
        font-size: 1.5rem !important; /* Increase button size */
        opacity: 0.8 !important; /* Ensure visibility */
        margin-left: 8px; /* Space from title */
    }

    .room-name-wrapper :global(button:hover) {
        opacity: 1 !important;
        transform: scale(1.1);
    }

    .room-id-chip {
        display: flex;
        align-items: center;
        gap: 8px;
        background: rgba(0, 0, 0, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.1);
        padding: 6px 16px;
        border-radius: 20px;
        cursor: pointer;
        transition: all 0.2s ease;
        font-family: monospace;
        color: var(--text-secondary);
        font-size: 0.9em;
    }

    .room-id-chip:hover {
        background: rgba(0, 0, 0, 0.3);
        border-color: rgba(255, 255, 255, 0.2);
        color: var(--text-primary);
    }

    .room-id-chip.copied {
        border-color: var(--success-color, #4caf50);
        color: var(--success-color, #4caf50);
        background: rgba(76, 175, 80, 0.1);
    }

    .id-label {
        opacity: 0.7;
    }

    .id-value {
        font-weight: bold;
    }

    .icon-wrapper {
        width: 16px;
        height: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .status-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-weight: 700;
        text-transform: uppercase;
        font-size: 0.75rem;
        letter-spacing: 1px;
        padding: 6px 12px;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.05);
    }

    .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: currentColor;
    }

    .status-badge.waiting {
        color: #4caf50;
        background: rgba(76, 175, 80, 0.1);
        border-color: rgba(76, 175, 80, 0.2);
    }

    .status-badge.playing {
        color: #2196f3;
        background: rgba(33, 150, 243, 0.1);
        border-color: rgba(33, 150, 243, 0.2);
    }

    .status-badge.finished {
        color: #9e9e9e;
    }
</style>
