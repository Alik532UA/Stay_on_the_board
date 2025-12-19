<script lang="ts">
  import { gameModeStore } from "$lib/stores/gameModeStore.js";
  import { gameSettingsStore } from "$lib/stores/gameSettingsStore.js";
  import { userActionService } from "$lib/services/userActionService.js";
  import { _ } from "svelte-i18n";
  import { tick } from "svelte";
  import { uiStateStore } from "$lib/stores/uiStateStore.js";
  import ButtonGroup from "$lib/components/ui/ButtonGroup.svelte";

  $: activeMode = $gameModeStore.activeMode;
  $: isCompetitiveMode =
    activeMode === "timed" || activeMode === "local" || activeMode === "online";

  // Helper: перевіряє, чи відповідає поточний gameMode legacy пресету
  function isPresetActive(legacyPreset: string): boolean {
    const currentMode = $gameSettingsStore.gameMode;
    if (!currentMode) return false;

    if (currentMode === legacyPreset) return true;

    if (legacyPreset === "observer" && currentMode === "local-observer")
      return true;
    if (
      legacyPreset === "beginner" &&
      currentMode === "virtual-player-beginner"
    )
      return true;
    if (
      legacyPreset === "experienced" &&
      (currentMode === "virtual-player-experienced" ||
        currentMode === "local-experienced")
    )
      return true;
    if (
      legacyPreset === "pro" &&
      (currentMode === "virtual-player-pro" || currentMode === "local-pro")
    )
      return true;
    if (legacyPreset === "timed" && currentMode === "virtual-player-timed")
      return true;

    return false;
  }

  let descriptionKey: string | null = null;

  $: {
    const currentMode = $gameSettingsStore.gameMode;
    if (!currentMode) {
      descriptionKey = null;
    } else if (
      currentMode.startsWith("virtual-player-") ||
      currentMode.startsWith("local-") ||
      currentMode.startsWith("online-")
    ) {
      descriptionKey = `gameModes.description.${currentMode}`;
    } else {
      descriptionKey = `gameModes.description.${currentMode}`;
    }
  }

  async function handlePresetClick(
    preset: "beginner" | "experienced" | "pro" | "timed" | "observer",
  ) {
    userActionService.setGameModePreset(preset);
    if (preset === "timed") {
      uiStateStore.update((s) => ({ ...s, settingsMode: "competitive" }));
    } else {
      uiStateStore.update((s) => ({ ...s, settingsMode: "default" }));
    }
    await userActionService.requestRestart();
  }
</script>

<div class="game-mode-widget">
  <h3 class="widget-title">{$_("gameModes.title")}</h3>

  {#if activeMode === "local"}
    <ButtonGroup
      options={[
        {
          label: $_("gameModes.observer"),
          active: isPresetActive("observer"),
          onClick: () => handlePresetClick("observer"),
          dataTestId: "settings-game-mode-local-observer",
        },
        {
          label: $_("gameModes.experienced"),
          active: isPresetActive("experienced"),
          onClick: () => handlePresetClick("experienced"),
          dataTestId: "settings-game-mode-local-experienced",
        },
        {
          label: $_("gameModes.pro"),
          active: isPresetActive("pro"),
          onClick: () => handlePresetClick("pro"),
          dataTestId: "settings-game-mode-local-pro",
        },
      ]}
    />
  {:else}
    <ButtonGroup
      options={[
        {
          label: $_("gameModes.beginner"),
          active: isPresetActive("beginner"),
          onClick: () => handlePresetClick("beginner"),
          dataTestId: "settings-game-mode-virtual-player-beginner",
        },
        {
          label: $_("gameModes.experienced"),
          active: isPresetActive("experienced"),
          onClick: () => handlePresetClick("experienced"),
          dataTestId: "settings-game-mode-virtual-player-experienced",
        },
        {
          label: $_("gameModes.pro"),
          active: isPresetActive("pro"),
          onClick: () => handlePresetClick("pro"),
          dataTestId: "settings-game-mode-virtual-player-pro",
        },
        {
          label: $_("gameModes.timed"),
          active: isPresetActive("timed"),
          onClick: () => handlePresetClick("timed"),
          dataTestId: "settings-game-mode-virtual-player-timed",
        },
      ]}
    />
  {/if}
  <div
    class="description"
    data-testid="game-mode-description"
    class:settings-expander-closed={!$uiStateStore.isSettingsExpanderOpen}
  >
    {#if descriptionKey}
      {$_(descriptionKey)}
    {/if}
  </div>
</div>

<style>
  .game-mode-widget {
    /* FIX: Додаємо змінні, які використовуються класами кнопок */
    --button-height: 36px;
    --button-padding: 4px 8px;
    --button-border-width: var(--global-border-width);
    --button-border-radius: 8px;
    --button-font-size: 1em;

    background: var(--bg-secondary);
    border-radius: var(--unified-border-radius);
    border: var(--unified-border);
    box-shadow: var(--dynamic-widget-shadow) var(--current-player-shadow-color);
    transition:
      background 0.25s,
      box-shadow 0.25s;
    backdrop-filter: var(--unified-backdrop-filter);
    padding: 16px;
    box-sizing: border-box;
    width: 100%;
  }
  .game-mode-widget:hover {
    box-shadow: var(--unified-shadow-hover);
  }
  .widget-title {
    font-weight: 700;
    color: var(--text-primary);
    margin: 0 0 12px 0;
    text-align: center;
    font-size: 1.1em;
  }
  .description {
    margin-top: 12px;
    padding: 8px;
    border-radius: 8px;
    background-color: rgba(0, 0, 0, 0.2);
    min-height: 50px;
    text-align: center;
    font-size: 0.9em;
    color: var(--text-secondary);
    transition: font-size 0.3s ease;
  }
  .description.settings-expander-closed {
    font-size: 18px;
  }
</style>
