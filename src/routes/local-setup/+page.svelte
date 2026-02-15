<script lang="ts">
  import FloatingBackButton from "$lib/components/FloatingBackButton.svelte";
  import PlayerManager from "$lib/components/local-setup/PlayerManager.svelte";
  import LocalGameSettings from "$lib/components/local-setup/LocalGameSettings.svelte";
  import { t } from "$lib/i18n/typedI18n";
  import { onMount } from "svelte";
  import { gameService } from "$lib/services/gameService";
  import { getRandomUnusedColor } from "$lib/utils/playerUtils";
  import type { Player } from "$lib/models/player";
  import { DEFAULT_PLAYER_NAMES } from "$lib/config/defaultPlayers";

  onMount(() => {
    const playerNames = DEFAULT_PLAYER_NAMES;
    const usedColors: string[] = [];
    const players: Player[] = playerNames.map((name, index) => {
      const color = getRandomUnusedColor(usedColors);
      usedColors.push(color);
      return {
        id: index + 1,
        type: "human",
        name,
        score: 0,
        color,
        isComputer: false,
        penaltyPoints: 0,
        bonusPoints: 0,
        bonusHistory: [] as any[],
      };
    });

    gameService.initializeNewGame({ players });
  });
</script>

<div class="page-container">
  <div class="header-container">
    <FloatingBackButton />
    <h1 data-testid="local-setup-title">{$t("localGame.title")}</h1>
  </div>

  <div class="setup-grid">
    <div class="grid-column">
      <PlayerManager />
    </div>
    <div class="grid-column">
      <LocalGameSettings />
    </div>
  </div>
</div>

<style>
  .page-container {
    width: 100%;
    max-width: 900px;
    margin: 0 auto;
    padding: 1rem;
    /* FIX: Додано box-sizing */
    box-sizing: border-box;
  }

  .header-container {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 2rem;
  }

  h1 {
    text-align: center;
    color: var(--text-primary);
    margin: 0;
  }

  .setup-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    align-items: start;
    width: 100%;
  }

  .grid-column {
    min-width: 0; /* Дозволяє грід-елементам стискатися */
  }

  /* Адаптивність для мобільних пристроїв */
  @media (max-width: 800px) {
    .setup-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
