<script lang="ts">
    import GamePageLayout from "$lib/components/layouts/GamePageLayout.svelte";
    import { WIDGETS } from "$lib/stores/layoutStore";
    import { gameModeService } from "$lib/services/gameModeService";
    import { roomService } from "$lib/services/roomService";
    import { logService } from "$lib/services/logService";
    import { goto, beforeNavigate } from "$app/navigation";
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

        gameModeService.initializeGameMode("online", true, {
            roomId: session.roomId,
        });
    }

    // FIX: При виході з гри НЕ викликаємо leaveRoom напряму.
    // Це дозволяє механізму heartbeat виявити disconnect і дати гравцю час повернутися.
    // leaveRoom викликається тільки при явному виході (кнопка "Вийти з гри" в модальних вікнах).
    beforeNavigate(async ({ to, cancel }) => {
        const session = roomService.getSession();
        if (session.roomId && session.playerId) {
            // Якщо ми йдемо в лобі цієї ж кімнати - це ок (рестарт)
            if (
                to?.route.id === "/online/lobby/[roomId]" &&
                to.params?.roomId === session.roomId
            ) {
                logService.init("[OnlineGamePage] Navigating to lobby of same room - OK.");
                return;
            }

            // FIX: НЕ викликаємо leaveRoom автоматично.
            // Якщо гравець закриє вкладку або перейде на іншу сторінку,
            // heartbeat перестане надходити і хост позначить його як disconnected.
            // Це дасть гравцю 30 секунд на повернення.
            logService.init("[OnlineGamePage] Navigating away. Heartbeat will stop, allowing reconnection.");
        }
    });

    function filterWidgets(id: string): boolean {
        return true;
    }
</script>

<GamePageLayout initLogic={initOnlineGame} widgetFilter={filterWidgets} />
