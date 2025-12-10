<script lang="ts">
  import GamePageLayout from "$lib/components/layouts/GamePageLayout.svelte";
  import { WIDGETS } from "$lib/stores/layoutStore";
  import { gameModeService } from "$lib/services/gameModeService";
  import { logService } from "$lib/services/logService";
  import { get } from "svelte/store";
  import { boardStore } from "$lib/stores/boardStore";

  function initTrainingGame() {
    const boardState = get(boardStore);
    if (!boardState || boardState.moveHistory.length <= 1) {
      logService.init(
        '[TrainingPage] onMount: No active game found, initializing "training" mode.',
      );
      gameModeService.initializeGameMode("training");
    } else {
      logService.init(
        "[TrainingPage] onMount: Active game found, not re-initializing.",
      );
    }
  }

  function filterWidgets(id: string): boolean {
    // У режимі тренування не показуємо індикатор ходу гравця та таймер
    return id !== WIDGETS.PLAYER_TURN_INDICATOR && id !== WIDGETS.TIMER;
  }
</script>

<GamePageLayout initLogic={initTrainingGame} widgetFilter={filterWidgets} />
