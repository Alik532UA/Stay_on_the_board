<script lang="ts">
  import { gameModeStore } from "$lib/stores/gameModeStore";
  import { gameSettingsStore } from "$lib/stores/gameSettingsStore";
  import { userActionService } from "$lib/services/userActionService";
  import { t } from "$lib/i18n/typedI18n";
  import { uiStateStore } from "$lib/stores/uiStateStore";
  import ButtonGroup from "$lib/components/ui/ButtonGroup.svelte";

  $: activeMode = $gameModeStore.activeMode;
  // FIX: Явно витягуємо gameMode для реактивності
  $: currentMode = $gameSettingsStore.gameMode;

  // Helper: перевіряє, чи відповідає поточний gameMode legacy пресету
  // FIX: Додано аргумент mode для забезпечення реактивності
  function isPresetActive(legacyPreset: string, mode: string | null): boolean {
    if (!mode) return false;

    if (mode === legacyPreset) return true;

    if (legacyPreset === "observer" && mode === "local-observer") return true;
    if (legacyPreset === "beginner" && mode === "virtual-player-beginner")
      return true;
    if (
      legacyPreset === "experienced" &&
      (mode === "virtual-player-experienced" || mode === "local-experienced")
    )
      return true;
    if (
      legacyPreset === "pro" &&
      (mode === "virtual-player-pro" || mode === "local-pro")
    )
      return true;
    if (legacyPreset === "timed" && mode === "virtual-player-timed")
      return true;

    return false;
  }

  let descriptionKey: string | null = null;

  $: {
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
    if (activeMode === "online") return;
    userActionService.setGameModePreset(preset);
    if (preset === "timed") {
      uiStateStore.update((s) => ({ ...s, settingsMode: "competitive" }));
    } else {
      uiStateStore.update((s) => ({ ...s, settingsMode: "default" }));
    }
    await userActionService.requestRestart();
  }

  // FIX: Опції тепер залежать від currentMode через аргумент функції
  $: localOptions = [
    {
      label: $t("gameModes.observer"),
      active: isPresetActive("observer", currentMode),
      onClick: () => handlePresetClick("observer"),
      dataTestId: "settings-game-mode-local-observer",
    },
    {
      label: $t("gameModes.experienced"),
      active: isPresetActive("experienced", currentMode),
      onClick: () => handlePresetClick("experienced"),
      dataTestId: "settings-game-mode-local-experienced",
    },
    {
      label: $t("gameModes.pro"),
      active: isPresetActive("pro", currentMode),
      onClick: () => handlePresetClick("pro"),
      dataTestId: "settings-game-mode-local-pro",
    },
  ];

  $: virtualPlayerOptions = [
    {
      label: $t("gameModes.beginner"),
      active: isPresetActive("beginner", currentMode),
      onClick: () => handlePresetClick("beginner"),
      dataTestId: "settings-game-mode-virtual-player-beginner",
    },
    {
      label: $t("gameModes.experienced"),
      active: isPresetActive("experienced", currentMode),
      onClick: () => handlePresetClick("experienced"),
      dataTestId: "settings-game-mode-virtual-player-experienced",
    },
    {
      label: $t("gameModes.pro"),
      active: isPresetActive("pro", currentMode),
      onClick: () => handlePresetClick("pro"),
      dataTestId: "settings-game-mode-virtual-player-pro",
    },
    {
      label: $t("gameModes.timed"),
      active: isPresetActive("timed", currentMode),
      onClick: () => handlePresetClick("timed"),
      dataTestId: "settings-game-mode-virtual-player-timed",
    },
  ];
</script>

<div class="game-mode-widget" data-testid="game-mode-widget">
  {#if activeMode === "online"}
    <div class="online-lock-overlay" data-testid="game-mode-widget-locked">
      <span>{$t("gameModes.notAvailableInOnline")}</span>
    </div>
  {/if}

  <h3 class="widget-title">{$t("gameModes.title")}</h3>

  {#if activeMode === "local"}
    <ButtonGroup options={localOptions} />
  {:else}
    <ButtonGroup options={virtualPlayerOptions} />
  {/if}
  <div
    class="description"
    data-testid="game-mode-description"
    class:settings-expander-closed={!$uiStateStore.isSettingsExpanderOpen}
  >
    {#if descriptionKey}
      {$t(descriptionKey as import("$lib/types/i18n").TranslationKey)}
    {/if}
  </div>
</div>

<style>
  .game-mode-widget {
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
    position: relative;
    overflow: hidden;
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

  .online-lock-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(2px);
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--unified-border-radius);
    color: #fff;
    font-weight: bold;
    text-align: center;
    padding: 10px;
  }
</style>
