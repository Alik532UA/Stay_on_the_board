<script lang="ts">
  import GamePageLayout from "$lib/components/layouts/GamePageLayout.svelte";
  import { WIDGETS } from "$lib/stores/layoutStore";
  import { gameModeService } from "$lib/services/gameModeService";
  import { logService } from "$lib/services/logService";
  import { get } from "svelte/store";
  import { boardStore } from "$lib/stores/boardStore";
  import { gameSettingsStore } from "$lib/stores/gameSettingsStore.js";

  function initVirtualPlayerGame() {
    const boardState = get(boardStore);
    // Only initialize if there is no game in progress.
    if (!boardState || boardState.moveHistory.length <= 1) {
      const settings = get(gameSettingsStore);
      const selectedMode = settings.gameMode;

      logService.init(
        `[VirtualPlayerPage] onMount: No active game. Initializing mode from settings: "${selectedMode}"`,
      );

      // Use the mode from settings, but have a fallback just in case.
      gameModeService.initializeGameMode(selectedMode || "virtual-player");
    } else {
      logService.init(
        "[VirtualPlayerPage] onMount: Active game found, not re-initializing.",
      );
    }
  }

  $: settings = $gameSettingsStore;

  $: widgetFilter = (id: string): boolean => {
    if (id === WIDGETS.PLAYER_TURN_INDICATOR) return false;

    if (
      id === WIDGETS.TIMER &&
      settings.gameMode !== "timed" &&
      settings.gameMode !== "virtual-player-timed"
    ) {
      return false;
    }
    return true;
  };
</script>

<GamePageLayout initLogic={initVirtualPlayerGame} {widgetFilter} />
