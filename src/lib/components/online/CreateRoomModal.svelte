<script lang="ts">
    import { _ } from "svelte-i18n";
    import { roomService } from "$lib/services/roomService";
    import { modalStore } from "$lib/stores/modalStore";
    import { goto } from "$app/navigation";
    import { base } from "$app/paths";
    import { logService } from "$lib/services/logService";
    import StyledButton from "$lib/components/ui/StyledButton.svelte";

    let roomName = "";
    let isPrivate = false;
    let isCreating = false;

    async function handleCreate() {
        logService.action("[CreateRoomModal] Create button clicked");

        if (isCreating) return;
        isCreating = true;

        try {
            let playerName = localStorage.getItem("online_playerName");
            if (!playerName) {
                playerName = `Player ${Math.floor(Math.random() * 1000)}`;
                localStorage.setItem("online_playerName", playerName);
            }

            logService.init(
                `[CreateRoomModal] Calling roomService.createRoom...`,
            );

            const roomId = await roomService.createRoom(
                playerName,
                isPrivate,
                roomName,
            );

            logService.init(`[CreateRoomModal] Success. ID: ${roomId}`);
            modalStore.closeModal();
            await goto(`${base}/online/lobby/${roomId}`);
        } catch (e: any) {
            logService.error("[CreateRoomModal] Failed to create room", e);
            // Показуємо конкретну помилку, якщо це таймаут
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
        <label for="room-name" data-testid="room-name-label"
            >{$_("onlineMenu.roomName")}</label
        >
        <input
            id="room-name"
            type="text"
            bind:value={roomName}
            placeholder={$_("onlineMenu.roomNamePlaceholder")}
            class="modal-input"
            data-testid="room-name-input"
        />
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
    }

    label {
        font-weight: bold;
        color: var(--text-secondary);
        font-size: 0.9em;
    }

    .modal-input {
        background: rgba(0, 0, 0, 0.2);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        padding: 12px;
        color: var(--text-primary);
        font-size: 1em;
    }

    .modal-input:focus {
        outline: none;
        border-color: var(--control-selected);
        box-shadow: 0 0 0 2px rgba(var(--control-selected-rgb), 0.2);
    }

    .checkbox-group {
        flex-direction: row;
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
