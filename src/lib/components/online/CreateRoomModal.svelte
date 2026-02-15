<script lang="ts">
    import { t } from "$lib/i18n/typedI18n";
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
    } from "$lib/utils/nameGenerator";

    let roomName = generateRandomRoomName();
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
                playerName = generateRandomPlayerName();
                localStorage.setItem("online_playerName", playerName);
            }

            const finalRoomName = roomName.trim() || generateRandomRoomName();
            const roomId = await roomService.createRoom(
                playerName,
                isPrivate,
                finalRoomName,
            );

            modalStore.closeModal();
            await goto(`${base}/online/lobby/${roomId}`);
        } catch (e: any) {
            logService.error("[CreateRoomModal] Failed to create room", e);
            const msg = e.message?.includes("Timeout")
                ? "Не вдалося з'єднатися з сервером."
                : $t("onlineMenu.errors.createFailed");
            alert(msg);
        } finally {
            isCreating = false;
        }
    }
</script>

<!-- FIX: Додано data-testid та структуру меню -->
<div class="create-room-content" data-testid="create-room-content">
    <h2 class="modal-title-menu">{$t("onlineMenu.createRoomTitle")}</h2>

    <div class="form-group">
        <span class="label" data-testid="room-name-label"
            >{$t("onlineMenu.roomName")}</span
        >
        <div class="name-editor-wrapper">
            <EditableText
                value={roomName}
                canEdit={true}
                onRandom={generateRandomRoomName}
                on:change={handleRoomNameChange}
                placeholder={$t("onlineMenu.roomNamePlaceholder")}
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
            <span>{$t("onlineMenu.privateRoom")}</span>
        </label>
    </div>

    <div class="actions-column">
        <StyledButton
            variant="primary"
            size="large"
            on:click={handleCreate}
            disabled={isCreating}
            dataTestId="create-room-confirm-btn"
        >
            {isCreating ? $t("common.loading") : $t("onlineMenu.create")}
        </StyledButton>

        <StyledButton
            variant="default"
            on:click={() => modalStore.closeModal()}
            dataTestId="create-room-cancel-btn"
        >
            {$t("onlineMenu.cancel")}
        </StyledButton>
    </div>
</div>

<style>
    .create-room-content {
        display: flex;
        flex-direction: column;
        gap: 24px;
        width: 100%;
        max-width: 400px;
        margin: 0 auto;
    }

    .modal-title-menu {
        text-align: center;
        font-size: 1.8em;
        font-weight: 800;
        color: #fff;
        margin: 0;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }

    .form-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
        align-items: center;
    }

    .label {
        font-weight: bold;
        color: rgba(255, 255, 255, 0.8);
        font-size: 0.9em;
    }

    .name-editor-wrapper {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 12px;
        padding: 8px 16px;
        width: 100%;
        display: flex;
        justify-content: center;
        backdrop-filter: blur(4px);
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
        color: #fff;
        font-weight: 600;
    }

    input[type="checkbox"] {
        width: 20px;
        height: 20px;
        cursor: pointer;
        accent-color: var(--control-selected);
    }

    .actions-column {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-top: 10px;
    }
</style>
