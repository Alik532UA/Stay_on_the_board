<script lang="ts">
    import { t } from "$lib/i18n/typedI18n";
    import StyledButton from "$lib/components/ui/StyledButton.svelte";
    import { roomService } from "$lib/services/roomService";
    import { navigationService } from "$lib/services/navigationService";
    import { modalStore } from "$lib/stores/modalStore";

    import { logService } from "$lib/services/logService";

    export let roomId: string;
    export let playerId: string;

    async function goToGame() {
        if (!roomId) {
            logService.error("[AbandonedGameModal] roomId is undefined!");
            return;
        }

        logService.ui(
            "[AbandonedGameModal] Checking room status before returning",
            { roomId },
        );

        // Отримуємо актуальний стан кімнати, щоб знати куди повертати
        const room = await roomService.getRoom(roomId);

        modalStore.closeModal();

        if (room && room.status === "playing") {
            logService.ui(
                "[AbandonedGameModal] Room is playing -> going to game page",
            );
            navigationService.goTo(`/game/online`);
        } else {
            logService.ui(
                "[AbandonedGameModal] Room is waiting/finished -> going to lobby",
            );
            navigationService.goTo(`/online/lobby/${roomId}`);
        }
    }

    async function leaveGame() {
        await roomService.leaveRoom(roomId, playerId);
        modalStore.closeModal();
    }
</script>

<div class="abandoned-game-content" data-testid="abandoned-game-content">
    <h2 class="modal-title-menu" data-testid="abandoned-game-title">
        {$t("onlineMenu.abandonedGame.title")}
    </h2>

    <p class="message" data-testid="abandoned-game-message">
        {$t("onlineMenu.abandonedGame.message")}
    </p>

    <div class="actions">
        <StyledButton
            variant="primary"
            size="large"
            on:click={goToGame}
            dataTestId="return-to-game-btn"
            class="action-btn"
        >
            {$t("onlineMenu.abandonedGame.return")}
        </StyledButton>

        <StyledButton
            variant="danger"
            size="large"
            on:click={leaveGame}
            dataTestId="leave-game-btn"
            class="action-btn"
        >
            {$t("onlineMenu.abandonedGame.leave")}
        </StyledButton>
    </div>
</div>

<style>
    .abandoned-game-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 24px;
        width: 100%;
        max-width: 400px;
    }

    .modal-title-menu {
        font-size: 1.8em;
        font-weight: 800;
        color: #fff;
        margin: 0;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }

    .message {
        font-size: 1.1em;
        color: rgba(255, 255, 255, 0.9);
        line-height: 1.5;
        margin: 0;
    }

    .actions {
        display: flex;
        flex-direction: column;
        gap: 16px;
        width: 100%;
    }

    :global(.action-btn) {
        width: 100%;
        justify-content: center;
    }
</style>
