<script lang="ts">
    import GamePageLayout from "$lib/components/layouts/GamePageLayout.svelte";
    import { WIDGETS } from "$lib/stores/layoutStore";
    import { gameModeService } from "$lib/services/gameModeService";
    import { roomService } from "$lib/services/roomService";
    import { logService } from "$lib/services/logService";
    import { goto } from "$app/navigation";
    import { base } from "$app/paths";
    import { onMount } from "svelte";

    function initOnlineGame() {
        const session = roomService.getSession();
        if (!session.roomId || !session.playerId) {
            logService.error(
                "[OnlineGamePage] No active session found. Redirecting to lobby.",
            );
            goto(`${base}/online`);
            return;
        }

        logService.init(
            `[OnlineGamePage] Initializing online game for room: ${session.roomId}`,
        );

        // Ініціалізуємо режим 'online' і передаємо roomId в options
        gameModeService.initializeGameMode("online", true, {
            roomId: session.roomId,
        });
    }

    function filterWidgets(id: string): boolean {
        // В онлайн режимі приховуємо налаштування, які можуть зламати синхронізацію
        // (наприклад, зміна розміру дошки або режиму блокування під час гри)
        // Але залишаємо візуальні налаштування

        // Поки що дозволяємо все, але SettingsExpander сам блокує критичні налаштування в competitive режимі
        // (а online режим вважається competitive)
        return true;
    }
</script>

<GamePageLayout initLogic={initOnlineGame} widgetFilter={filterWidgets} />
