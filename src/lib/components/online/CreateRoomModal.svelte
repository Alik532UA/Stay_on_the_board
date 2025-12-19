<script lang="ts">
    import { _ } from "svelte-i18n";
    import { roomService } from "$lib/services/roomService";
    import { modalStore } from "$lib/stores/modalStore";
    import { goto } from "$app/navigation";
    import { base } from "$app/paths";
    import { logService } from "$lib/services/logService";
    import StyledButton from "$lib/components/ui/StyledButton.svelte";
    import EditableText from "$lib/components/ui/EditableText.svelte";
    import {
        generateRandomRoomName,
        generateRandomPlayerName,
    } from "$lib/utils/nameGenerator"; // ВИПРАВЛЕНО

    // Ініціалізуємо випадковою назвою одразу
    let roomName = generateRandomRoomName(); // ВИПРАВЛЕНО
    let isPrivate = false;
    let isCreating = false;

    function handleRoomNameChange(e: CustomEvent<string>) {
        roomName = e.detail;
    }

    async function handleCreate() {
        logService.action("[CreateRoomModal] Create button clicked");

        if (isCreating) return;
        isCreating = true;

        try {
            let playerName = localStorage.getItem("online_playerName");
            if (!playerName) {
                playerName = generateRandomPlayerName(); // ВИПРАВЛЕНО
                localStorage.setItem("online_playerName", playerName);
            }

            logService.init(
                `[CreateRoomModal] Calling roomService.createRoom...`,
            );

            const finalRoomName = roomName.trim() || generateRandomRoomName(); // ВИПРАВЛЕНО

            const roomId = await roomService.createRoom(
                playerName,
                isPrivate,
                finalRoomName,
            );

            logService.init(`[CreateRoomModal] Success. ID: ${roomId}`);
            modalStore.closeModal();
            await goto(`${base}/online/lobby/${roomId}`);
        } catch (e: any) {
            logService.error("[CreateRoomModal] Failed to create room", e);
            const msg = e.message?.includes("Timeout")
                ? "Не вдалося з'єднатися з сервером. Перевірте інтернет."
                : $_("onlineMenu.errors.createFailed");
            alert(msg);
        } finally {
            isCreating = false;
        }
    }
</script>

<div class="create-room-form" data-testid="create-room-form">
    <div class="form-group">
        <span class="label" data-testid="room-name-label"
            >{$_("onlineMenu.roomName")}</span
        >

        <div class="name-editor-wrapper">
            <EditableText
                value={roomName}
                canEdit={true}
                onRandom={generateRandomRoomName}
                on:change={handleRoomNameChange}
                placeholder={$_("onlineMenu.roomNamePlaceholder")}
                dataTestId="room-name-input"
            />
        </div>
    </div>

    <div class="form-group checkbox-group">
        <label class="checkbox-label" data-testid="private-room-label">
            <input
                type="checkbox"
                bind:checked={isPrivate}
                data-testid="private-room-checkbox"
            />
            <span>{$_("onlineMenu.privateRoom")}</span>
        </label>
    </div>

    <div class="modal-action-buttons">
        <StyledButton
            variant="default"
            on:click={() => modalStore.closeModal()}
            dataTestId="create-room-cancel-btn"
        >
            {$_("onlineMenu.cancel")}
        </StyledButton>
        <StyledButton
            variant="primary"
            on:click={handleCreate}
            disabled={isCreating}
            dataTestId="create-room-confirm-btn"
        >
            {isCreating ? $_("common.loading") : $_("onlineMenu.create")}
        </StyledButton>
    </div>
</div>

<style>
    .create-room-form {
        display: flex;
        flex-direction: column;
        gap: 20px;
        padding: 10px 0;
    }

    .form-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
        align-items: center;
    }

    .label {
        font-weight: bold;
        color: var(--text-secondary);
        font-size: 0.9em;
    }

    .name-editor-wrapper {
        background: rgba(0, 0, 0, 0.2);
        border: var(--global-border-width) solid var(--border-color);
        border-radius: 8px;
        padding: 8px 16px;
        width: 100%;
        display: flex;
        justify-content: center;
    }

    .checkbox-group {
        flex-direction: row;
        justify-content: center;
    }

    .checkbox-label {
        display: flex;
        align-items: center;
        gap: 10px;
        cursor: pointer;
        color: var(--text-primary);
    }

    input[type="checkbox"] {
        width: 20px;
        height: 20px;
        cursor: pointer;
    }

    .modal-action-buttons {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        margin-top: 10px;
    }
</style>
