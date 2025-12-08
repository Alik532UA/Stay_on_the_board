<script lang="ts">
  import { gameModeStore } from "$lib/stores/gameModeStore.js";
  import { gameSettingsStore } from "$lib/stores/gameSettingsStore.js";
  import { userActionService } from "$lib/services/userActionService.js";
  import { _ } from "svelte-i18n";
  import { tick } from "svelte";
  import { uiStateStore } from "$lib/stores/uiStateStore.js";

  $: activeMode = $gameModeStore.activeMode;
  $: isCompetitiveMode =
    activeMode === "timed" || activeMode === "local" || activeMode === "online";

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

  function fitTextAction(node: HTMLElement, dependency: any) {
    const buttons = Array.from(
      node.querySelectorAll(".settings-expander__row-btn"),
    ) as HTMLElement[];

    const fit = () => {
      if (buttons.length === 0) return;

      buttons.forEach((btn) => (btn.style.fontSize = ""));

      tick().then(() => {
        const initialFontSize = parseFloat(
          getComputedStyle(buttons[0]).fontSize,
        );
        let currentFontSize = initialFontSize;

        const fontSizeStep = 0.5;
        while (node.scrollWidth > node.clientWidth && currentFontSize > 12) {
          currentFontSize -= fontSizeStep;
          buttons.forEach(
            (btn) => (btn.style.fontSize = `${currentFontSize}px`),
          );
        }
      });
    };

    const observer = new ResizeObserver(fit);
    observer.observe(node);

    tick().then(fit);

    return {
      update(newDependency: any) {
        tick().then(fit);
      },
      destroy() {
        observer.disconnect();
      },
    };
  }
</script>

<div class="game-mode-widget">
  <h3 class="widget-title">{$_("gameModes.title")}</h3>
  <div
    class="settings-expander__game-mode-row"
    use:fitTextAction={$_("gameModes.beginner")}
  >
    {#if activeMode === "local"}
      <button
        data-testid="settings-expander-game-mode-observer-btn"
        class="settings-expander__row-btn"
        class:active={$gameSettingsStore.gameMode === "observer"}
        on:click={() => handlePresetClick("observer")}
        >{$_("gameModes.observer")}</button
      >
      <button
        data-testid="settings-expander-game-mode-experienced-btn"
        class="settings-expander__row-btn"
        class:active={$gameSettingsStore.gameMode === "experienced"}
        on:click={() => handlePresetClick("experienced")}
        >{$_("gameModes.experienced")}</button
      >
      <button
        data-testid="settings-expander-game-mode-pro-btn"
        class="settings-expander__row-btn"
        class:active={$gameSettingsStore.gameMode === "pro"}
        on:click={() => handlePresetClick("pro")}>{$_("gameModes.pro")}</button
      >
    {:else}
      <button
        data-testid="settings-expander-game-mode-beginner-btn"
        class="settings-expander__row-btn"
        class:active={$gameSettingsStore.gameMode === "beginner"}
        on:click={() => handlePresetClick("beginner")}
        >{$_("gameModes.beginner")}</button
      >
      <button
        data-testid="settings-expander-game-mode-experienced-btn"
        class="settings-expander__row-btn"
        class:active={$gameSettingsStore.gameMode === "experienced"}
        on:click={() => handlePresetClick("experienced")}
        >{$_("gameModes.experienced")}</button
      >
      <button
        data-testid="settings-expander-game-mode-pro-btn"
        class="settings-expander__row-btn"
        class:active={$gameSettingsStore.gameMode === "pro"}
        on:click={() => handlePresetClick("pro")}>{$_("gameModes.pro")}</button
      >
      <button
        data-testid="settings-expander-game-mode-timed-btn"
        class="settings-expander__row-btn"
        class:active={$gameSettingsStore.gameMode === "timed"}
        on:click={() => handlePresetClick("timed")}
        >{$_("gameModes.timed")}</button
      >
    {/if}
  </div>
  <div
    class="description"
    data-testid="game-mode-description"
    class:settings-expander-closed={!$uiStateStore.isSettingsExpanderOpen}
  >
    {#if $gameSettingsStore.gameMode === "beginner"}
      {$_("gameModes.description.beginner")}
    {:else if $gameSettingsStore.gameMode === "experienced"}
      {$_("gameModes.description.experienced")}
    {:else if $gameSettingsStore.gameMode === "pro"}
      {$_("gameModes.description.pro")}
    {:else if $gameSettingsStore.gameMode === "timed"}
      {$_("gameModes.description.timed")}
    {:else if $gameSettingsStore.gameMode === "observer"}
      {$_("gameModes.description.observer")}
    {/if}
  </div>
</div>

<style>
  .game-mode-widget {
    background: var(--bg-secondary);
    border-radius: var(--unified-border-radius);
    border: var(--unified-border);
    box-shadow: var(--dynamic-widget-shadow) var(--current-player-shadow-color);
    transition:
      background 0.25s,
      box-shadow 0.25s;
    backdrop-filter: var(--unified-backdrop-filter);
    padding: 16px;
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
  .settings-expander__game-mode-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
  }
  .settings-expander__row-btn {
    background: var(--control-bg);
    color: var(--text-primary);
    border: 1.5px solid #888;
    border-radius: 8px;
    padding: 0 10.8px;
    height: 36px;
    min-height: 36px;
    box-sizing: border-box;
    font-size: 14.4px;
    font-weight: 600;
    cursor: pointer;
    transition:
      background 0.18s,
      color 0.18s,
      border 0.18s;
    display: flex;
    align-items: center;
    justify-content: center;
    white-space: nowrap;
  }
  .settings-expander__row-btn:hover,
  .settings-expander__row-btn:focus {
    border-color: var(--control-selected);
    color: var(--text-primary);
    outline: none;
  }
  .settings-expander__row-btn.active {
    background: var(--control-selected);
    color: var(--control-selected-text);
    border-color: var(--control-selected);
    transform: scale(1.07);
    z-index: 1;
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
