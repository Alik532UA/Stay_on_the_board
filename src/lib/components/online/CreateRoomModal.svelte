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
        if (isCreating) return;
        isCreating = true;

        try {
            // Отримуємо або запитуємо ім'я гравця
            let playerName = localStorage.getItem("online_playerName");
            if (!playerName) {
                playerName = `Player ${Math.floor(Math.random() * 1000)}`;
                localStorage.setItem("online_playerName", playerName);
            }

            // Якщо назва пуста, roomService згенерує її сам, але ми можемо передати кастомну
            // Тут ми передаємо ім'я хоста, а назву кімнати roomService згенерує, якщо ми не передамо її в майбутньому API
            // Поки що roomService.createRoom приймає (hostName, isPrivate)

            const roomId = await roomService.createRoom(playerName, isPrivate);

            modalStore.closeModal();
            goto(`${base}/online/lobby/${roomId}`);
        } catch (e) {
            logService.error("Failed to create room", e);
            alert($_("onlineMenu.errors.createFailed"));
        } finally {
            isCreating = false;
        }
    }
</script>

<div class="create-room-form">
    <div class="form-group">
        <label for="room-name">{$_("onlineMenu.roomName")}</label>
        <input
            id="room-name"
            type="text"
            bind:value={roomName}
            placeholder={$_("onlineMenu.roomNamePlaceholder")}
            class="modal-input"
            disabled
            title="Custom room names coming soon"
        />
    </div>

    <div class="form-group checkbox-group">
        <label class="checkbox-label">
            <input type="checkbox" bind:checked={isPrivate} />
            <span>{$_("onlineMenu.privateRoom")}</span>
        </label>
    </div>

    <div class="modal-action-buttons">
        <StyledButton
            variant="default"
            on:click={() => modalStore.closeModal()}
        >
            {$_("onlineMenu.cancel")}
        </StyledButton>
        <StyledButton
            variant="primary"
            on:click={handleCreate}
            disabled={isCreating}
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
