<script lang="ts">
  import { derived } from "svelte/store";
  import { gameSettingsStore } from "$lib/stores/gameSettingsStore.js";
  import { _ } from "svelte-i18n";
  import {
    lastComputerMove,
    lastPlayerMove,
    isPlayerTurn,
    isPauseBetweenMoves,
    isGameOver,
    isFirstMove,
  } from "$lib/stores/derivedState.ts";
  import { i18nReady } from "$lib/i18n/init.js";
  import { fade, slide } from "svelte/transition";
  import { quintOut } from "svelte/easing";
  import { playerStore } from "$lib/stores/playerStore";
  import { logService } from "$lib/services/logService.js";
  import { uiStateStore } from "$lib/stores/uiStateStore";
  import CompactComputerMove from "$lib/components/widgets/game-info/CompactComputerMove.svelte";
  import StructuredMessage from "$lib/components/widgets/game-info/StructuredMessage.svelte";

  // --- Допоміжні функції ---
  function getPlayerColor(players: any[], playerName: string): string | null {
    const player = players.find((p) => p.name === playerName);
    return player ? player.color : null;
  }

  function getPlayerNameStyle(players: any[], playerName: string): string {
    const color = getPlayerColor(players, playerName);
    return color ? `background-color: ${color};` : "";
  }

  const directionArrows: Record<string, string> = {
    "up-left": "↖",
    up: "↑",
    "up-right": "↗",
    left: "←",
    right: "→",
    "down-left": "↙",
    down: "↓",
    "down-right": "↘",
  };

  const isCompact = derived(
    gameSettingsStore,
    ($settings) => $settings.showGameInfoWidget === "compact",
  );

  const displayMessage = derived(
    [
      playerStore,
      isGameOver,
      isFirstMove,
      lastComputerMove,
      lastPlayerMove,
      isPlayerTurn,
      _,
      isCompact,
      gameSettingsStore,
      uiStateStore,
    ],
    ([
      $playerStore,
      $isGameOver,
      $isFirstMove,
      $lastComputerMove,
      $lastPlayerMove,
      $isPlayerTurn,
      $_,
      $isCompact,
      $gameSettings,
      $uiState,
    ]) => {
      if (!$playerStore) return { type: "SIMPLE", content: "" };

      const humanPlayersCount = $playerStore.players.filter(
        (p: any) => p.type === "human",
      ).length;
      const isLocalGame = humanPlayersCount > 1;
      const currentPlayer =
        $playerStore.players[$playerStore.currentPlayerIndex];

      if ($isGameOver)
        return { type: "SIMPLE", content: $_("gameBoard.gameInfo.gameOver") };

      if ($isFirstMove) {
        // FIX: Покращена логіка для першого ходу в онлайні
        if ($uiState.intendedGameType === "online") {
          if ($isPlayerTurn) {
            return {
              type: "SIMPLE",
              content: `${$_("gameBoard.gameInfo.firstMove")}\n${$_("gameBoard.gameInfo.yourTurnToMakeAMove")}`,
            };
          } else {
            // Показуємо ім'я суперника
            return {
              type: "STRUCTURED",
              lines: [
                {
                  type: "line" as const,
                  parts: [
                    {
                      type: "text" as const,
                      content: $_("gameBoard.gameInfo.firstMove"),
                    },
                  ],
                },
                {
                  type: "line" as const,
                  parts: [
                    { type: "text" as const, content: "Зараз ходить: " },
                    {
                      type: "player" as const,
                      name: currentPlayer.name,
                      style: getPlayerNameStyle(
                        $playerStore.players,
                        currentPlayer.name,
                      ),
                    },
                  ],
                },
              ],
            };
          }
        }

        if (isLocalGame) {
          return {
            type: "STRUCTURED",
            lines: [
              {
                type: "line" as const,
                parts: [
                  {
                    type: "text" as const,
                    content: $_("gameBoard.gameInfo.firstMove"),
                  },
                ],
              },
              {
                type: "line" as const,
                parts: [
                  {
                    type: "player" as const,
                    name: currentPlayer.name,
                    style: getPlayerNameStyle(
                      $playerStore.players,
                      currentPlayer.name,
                    ),
                  },
                  {
                    type: "text" as const,
                    content:
                      ", " +
                      $_(
                        "gameBoard.gameInfo.yourTurnToMakeAMove",
                      ).toLowerCase(),
                  },
                ],
              },
            ],
          };
        }

        let message = `${$_("gameBoard.gameInfo.firstMove")}\n`;
        if ($gameSettings.gameMode !== "beginner") {
          message += `${$_("gameBoard.gameInfo.rememberPieceLocation")}\n`;
        }
        message += $_("gameBoard.gameInfo.yourTurnToMakeAMove");
        return { type: "SIMPLE", content: message };
      }

      // ... (логіка lastComputerMove без змін) ...
      if ($lastComputerMove) {
        const directionKey = $lastComputerMove.direction.replace(
          /-(\w)/g,
          (_: string, c: string) => c.toUpperCase(),
        );
        const direction = $_(`gameBoard.directions.${directionKey}`);
        const distance = $lastComputerMove.distance;

        if ($isCompact) {
          return {
            type: "COMPACT_COMPUTER_MOVE",
            part1: $_("gameBoard.gameInfo.computerMadeMovePart1"),
            move: `${directionArrows[$lastComputerMove.direction] || "?"}${distance}`,
            part2: $_("gameBoard.gameInfo.computerMadeMovePart2"),
          };
        }
        return {
          type: "SIMPLE",
          content: $_("gameBoard.gameInfo.computerMadeMove", {
            values: { direction, distance },
          }),
        };
      }

      // ... (логіка lastPlayerMove без змін) ...
      if ($lastPlayerMove && isLocalGame) {
        const previousPlayerIndex =
          ($playerStore.currentPlayerIndex + $playerStore.players.length - 1) %
          $playerStore.players.length;
        const previousPlayer = $playerStore.players[previousPlayerIndex];
        const directionKey = $lastPlayerMove.direction.replace(
          /-(\w)/g,
          (_: string, c: string) => c.toUpperCase(),
        );
        const direction = $_(`gameBoard.directions.${directionKey}`);
        return {
          type: "STRUCTURED",
          lines: [
            {
              type: "line" as const,
              parts: [
                {
                  type: "player" as const,
                  name: previousPlayer.name,
                  style: getPlayerNameStyle(
                    $playerStore.players,
                    previousPlayer.name,
                  ),
                },
                {
                  type: "text" as const,
                  content: ` зробив хід: ${direction} на ${$lastPlayerMove.distance}.`,
                },
              ],
            },
            {
              type: "line" as const,
              parts: [
                {
                  type: "player" as const,
                  name: currentPlayer.name,
                  style: getPlayerNameStyle(
                    $playerStore.players,
                    currentPlayer.name,
                  ),
                },
                { type: "text" as const, content: " ваша черга робити хід!" },
              ],
            },
          ],
        };
      }

      if ($isPlayerTurn) {
        if (isLocalGame) {
          return {
            type: "STRUCTURED",
            lines: [
              {
                type: "line" as const,
                parts: [
                  { type: "text" as const, content: "Хід гравця: " },
                  {
                    type: "player" as const,
                    name: currentPlayer.name,
                    style: getPlayerNameStyle(
                      $playerStore.players,
                      currentPlayer.name,
                    ),
                  },
                ],
              },
            ],
          };
        }
        return { type: "SIMPLE", content: $_("gameBoard.gameInfo.playerTurn") };
      }

      if (!$isPlayerTurn) {
        if ($uiState.intendedGameType === "online") {
          // FIX: Показуємо ім'я того, хто ходить
          return {
            type: "STRUCTURED",
            lines: [
              {
                type: "line" as const,
                parts: [
                  { type: "text" as const, content: "Зараз ходить: " },
                  {
                    type: "player" as const,
                    name: currentPlayer.name,
                    style: getPlayerNameStyle(
                      $playerStore.players,
                      currentPlayer.name,
                    ),
                  },
                ],
              },
            ],
          };
        }
        return {
          type: "SIMPLE",
          content: $_("gameBoard.gameInfo.computerTurn"),
        };
      }

      return { type: "SIMPLE", content: $_("gameBoard.gameInfo.gameStarted") };
    },
  );
</script>

{#if $i18nReady && $playerStore}
  {#if $gameSettingsStore.showGameInfoWidget !== "hidden"}
    <div
      class="game-info-widget"
      class:compact={$gameSettingsStore.showGameInfoWidget === "compact"}
      transition:slide={{ duration: 400, easing: quintOut }}
      data-testid="game-info-panel"
    >
      <div class="game-info-content" data-testid="game-info-content">
        {#key $displayMessage}
          <div
            class="fade-wrapper"
            in:fade={{ duration: 250, delay: 250 }}
            out:fade={{ duration: 250 }}
          >
            {#if $displayMessage.type === "COMPACT_COMPUTER_MOVE"}
              <CompactComputerMove message={$displayMessage as any} />
            {:else if $displayMessage.type === "STRUCTURED"}
              <StructuredMessage lines={$displayMessage.lines} />
            {:else}
              {$displayMessage.content}
            {/if}
          </div>
        {/key}
      </div>
    </div>
  {/if}
{/if}

<style>
  .game-info-widget {
    background: var(--bg-secondary);
    padding: 20px 12px;
    border-radius: var(--unified-border-radius);
    box-shadow: var(--dynamic-widget-shadow) var(--current-player-shadow-color);
    font-size: 1.1em;
    color: var(--text-primary, #222);
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: var(--unified-backdrop-filter);
    border: var(--unified-border);
    /* overflow: hidden; -- видаляємо, щоб slide працював коректно */
  }

  .game-info-content {
    font-weight: 500;
    line-height: 1.4;
    width: 100%;
    word-wrap: break-word;
    white-space: pre-line;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    position: relative; /* Батьківський елемент для абсолютно позиціонованої обгортки */
    min-height: 50px; /* Задаємо мінімальну висоту, щоб уникнути стрибків розміру */
  }

  .fade-wrapper {
    /* Робимо обгортку абсолютною, щоб стара і нова версії могли анімуватися одна над одною */
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
  }
</style>
