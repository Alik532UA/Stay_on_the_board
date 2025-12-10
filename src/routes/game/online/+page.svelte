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

    // FIX: Автоматичний вихід з кімнати при виході з гри
    beforeNavigate(async ({ to, cancel }) => {
        // Якщо ми просто оновлюємо сторінку або йдемо в лобі (наприклад, після завершення),
        // то можливо не треба виходити. Але зазвичай вихід з гри = вихід з кімнати.
        // Якщо ми йдемо в лобі тієї ж кімнати - це ок (наприклад, рестарт).

        const session = roomService.getSession();
        if (session.roomId && session.playerId) {
            // Якщо ми йдемо в лобі цієї ж кімнати - не виходимо
            if (
                to?.route.id === "/online/lobby/[roomId]" &&
                to.params?.roomId === session.roomId
            ) {
                return;
            }

            // Інакше - виходимо
            logService.init("[OnlineGamePage] Navigating away, leaving room.");
            roomService.leaveRoom(session.roomId, session.playerId);
        }
    });

    function filterWidgets(id: string): boolean {
        return true;
    }
</script>

<GamePageLayout initLogic={initOnlineGame} widgetFilter={filterWidgets} />
