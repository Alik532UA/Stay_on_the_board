<script lang="ts">
  import { playerStore } from "$lib/stores/playerStore";
  import { t } from "$lib/i18n/typedI18n";
  import { get } from "svelte/store";
  import { navigationService } from "$lib/services/navigationService.js";
  import ColorPicker from "./ColorPicker.svelte";
  import { logService } from "$lib/services/logService.js";
  import { customTooltip } from "$lib/actions/customTooltip.js";
  import {
    generateId,
    getRandomUnusedColor,
    getRandomUnusedName,
  } from "$lib/utils/playerUtils";
  import type { Player, BonusHistoryItem } from "$lib/models/player";
  import NotoEmoji from "$lib/components/NotoEmoji.svelte";

  function startGame() {
    logService.action('Click: "Почати гру" (PlayerManager)');
    navigationService.goTo("/game/local");
  }

  function addPlayer() {
    playerStore.update((s) => {
      if (!s || s.players.length >= 8) return s;
      const usedColors = s.players.map((p) => p.color);
      const usedNames = s.players.map((p) => p.name);
      const newPlayer: Player = {
        id: generateId(),
        name: getRandomUnusedName(usedNames),
        color: getRandomUnusedColor(usedColors),
        score: 0,
        isComputer: false,
        type: "human" as const,
        penaltyPoints: 0,
        bonusPoints: 0,
        bonusHistory: [] as BonusHistoryItem[],
        roundScore: 0,
      };
      return { ...s, players: [...s.players, newPlayer] };
    });
  }

  function removePlayer(playerId: number) {
    playerStore.update((s) => {
      if (!s || s.players.length <= 2) return s;
      return { ...s, players: s.players.filter((p) => p.id !== playerId) };
    });
  }

  function updatePlayer(playerId: number, updatedData: Partial<Player>) {
    playerStore.update((s) => {
      if (!s) return null;
      return {
        ...s,
        players: s.players.map((p) =>
          p.id === playerId ? { ...p, ...updatedData } : p,
        ),
      };
    });
  }
</script>

{#if $playerStore}
  <div class="player-manager-card">
    <h2 data-testid="player-manager-title">
      {$t("localGame.playerManagerTitle")}
    </h2>

    <div class="player-list">
      {#each $playerStore.players as player (player.id)}
        <div class="player-row">
          <!-- FIX: Передаємо унікальний dataTestId -->
          <ColorPicker
            value={player.color}
            dataTestId="player-color-picker-{player.id}"
            on:change={(e) =>
              updatePlayer(player.id, { color: e.detail.value })}
          />
          <button
            class="player-type-btn"
            use:customTooltip={$t("localGame.togglePlayerType")}
            on:click={() =>
              updatePlayer(player.id, {
                type: player.type === "human" ? "ai" : "human",
              })}
            data-testid="player-type-btn-{player.id}"
          >
            {#if player.type === "ai"}
              <NotoEmoji name="robot" size="24px" />
            {:else}
              <NotoEmoji name="bust_in_silhouette" size="24px" />
            {/if}
          </button>
          <input
            type="text"
            class="player-name-input"
            placeholder="Ім'я гравця"
            value={player.name}
            on:input={(e) =>
              updatePlayer(player.id, {
                name: (e.currentTarget as HTMLInputElement).value,
              })}
            data-testid="player-name-input-{player.id}"
          />
          <button
            class="remove-player-btn"
            use:customTooltip={$t("localGame.removePlayer")}
            on:click={() => {
              logService.action(
                `Click: "Видалити гравця: ${player.name}" (PlayerManager)`,
              );
              removePlayer(player.id);
            }}
            disabled={$playerStore.players.length <= 2}
            data-testid="remove-player-btn-{player.id}"
          >
            ×
          </button>
        </div>
      {/each}
    </div>

    <div class="manager-actions">
      <button
        class="add-player-btn"
        on:click={() => {
          logService.action('Click: "Додати гравця" (PlayerManager)');
          addPlayer();
        }}
        disabled={$playerStore.players.length >= 8}
        data-testid="add-player-btn"
      >
        {$t("localGame.addPlayer")}
      </button>
      <button
        class="start-game-btn"
        on:click={startGame}
        data-testid="start-game-btn"
      >
        {$t("localGame.startGame")}
      </button>
    </div>
  </div>
{/if}

<style>
  .player-manager-card {
    background: var(--bg-secondary);
    padding: 24px;
    border-radius: var(--unified-border-radius);
    box-shadow: var(--unified-shadow);
    border: var(--unified-border);
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  h2 {
    text-align: center;
    margin: 0 0 10px 0;
    color: var(--text-primary);
  }
  .player-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .player-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .player-type-btn {
    width: 40px;
    height: 40px;
    padding: 0;
    border-radius: 8px;
    border: var(--global-border-width) solid var(--border-color);
    background: var(--control-bg);
    color: var(--text-primary);
    font-size: 1.5em;
    cursor: pointer;
    transition: background 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .player-name-input {
    flex-grow: 1;
    padding: 10px 14px;
    border-radius: 8px;
    border: var(--global-border-width) solid var(--border-color);
    background: var(--control-bg);
    color: var(--text-primary);
    font-size: 1em;
  }
  .remove-player-btn {
    width: 32px;
    height: 32px;
    min-height: 32px;
    max-height: 32px;
    padding: 0;
    border-radius: 50%;
    border: none;
    background: var(--error-color);
    color: white;
    font-size: 1.5em;
    font-weight: bold;
    cursor: pointer;
    transition: background 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    align-self: center;
  }
  .remove-player-btn:disabled {
    background: var(--disabled-bg);
    cursor: not-allowed;
    opacity: 0.5;
  }
  .manager-actions {
    margin-top: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .add-player-btn,
  .start-game-btn {
    padding: 12px;
    font-size: 1.1em;
    font-weight: bold;
    border-radius: 10px;
    border: none;
    cursor: pointer;
    transition:
      background 0.2s,
      transform 0.1s;
  }
  .add-player-btn {
    background: var(--control-bg);
    color: var(--text-primary);
  }
  .add-player-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .start-game-btn {
    background: var(--confirm-action-bg);
    color: var(--confirm-action-text);
  }
</style>
