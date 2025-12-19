<script lang="ts">
  import { _ } from "svelte-i18n";
  import { onMount } from "svelte";
  import {
    testModeStore,
    type PositionMode,
    type ComputerMoveMode,
    type TestModeState,
  } from "$lib/stores/testModeStore";
  import { logService } from "$lib/services/logService.js";

  let manualDirection: string | null = null;
  let manualDistance: number = 1;
  let manualX: number = 0;
  let manualY: number = 0;

  // НАВІЩО: Цей реактивний блок є ключовим виправленням. Він підписується на зміни
  // в testModeStore і гарантує, що локальні змінні компонента (які керують UI)
  // ЗАВЖДИ синхронізовані з єдиним джерелом правди (SSoT).
  // Це усуває розсинхронізацію і вирішує проблему скидання стану.
  $: {
    if ($testModeStore) {
      manualDirection = $testModeStore.manualComputerMove.direction;
      manualDistance = $testModeStore.manualComputerMove.distance ?? 1;
      manualX = $testModeStore.manualStartPosition?.x ?? 0;
      manualY = $testModeStore.manualStartPosition?.y ?? 0;
    }
  }

  function setStartPositionMode(mode: PositionMode) {
    testModeStore.update((state) => ({
      ...state,
      startPositionMode: mode,
      manualStartPosition: null,
    }));
  }

  function setManualStartPosition() {
    testModeStore.update((state) => ({
      ...state,
      startPositionMode: "manual",
      manualStartPosition: { x: manualX, y: manualY },
    }));
  }

  function setComputerMoveMode(mode: ComputerMoveMode) {
    manualDirection = null;
    testModeStore.update((state) => ({
      ...state,
      computerMoveMode: mode,
      manualComputerMove: { direction: null, distance: null },
    }));
  }

  function handleDirection(dir: string) {
    manualDirection = dir;
    setManualComputerMove(dir, manualDistance);
  }

  function setManualMoveProperties() {
    if (manualDirection) {
      setManualComputerMove(manualDirection, manualDistance);
    }
  }

  function setManualComputerMove(direction: string, distance: number) {
    const newState: Partial<TestModeState> = {
      computerMoveMode: "manual",
      manualComputerMove: { direction, distance },
    };
    testModeStore.update((state) => {
      const updatedState = { ...state, ...newState };
      logService.testMode(
        "TestModeWidget: оновлено testModeStore",
        updatedState,
      );
      return updatedState;
    });
  }
  onMount(() => {
    logService.testMode("TestModeWidget mounted");
  });
</script>

<div class="test-mode-widget">
  <h3 class="test-mode-widget-title">{$_("testMode.title")}</h3>

  <div class="test-mode-control-group">
    <h4 class="test-mode-group-title">{$_("testMode.startPosition")}</h4>
    <div class="test-mode-btn-group">
      <button
        class="test-mode-row-btn"
        on:click={() => setStartPositionMode("random")}
        class:active={$testModeStore.startPositionMode === "random"}
        data-testid="test-mode-start-pos-random-btn"
        >{$_("testMode.random")}</button
      >
      <button
        class="test-mode-row-btn"
        on:click={() => setStartPositionMode("manual")}
        class:active={$testModeStore.startPositionMode === "manual"}
        data-testid="test-mode-start-pos-manual-btn"
        >{$_("testMode.manual")}</button
      >
    </div>
    {#if $testModeStore.startPositionMode === "manual"}
      <div class="test-mode-manual-coords">
        <div class="test-mode-input-group">
          <label for="manualX">{$_("testMode.x")}</label>
          <input
            id="manualX"
            class="test-mode-input"
            type="number"
            bind:value={manualX}
            min="0"
            max="7"
            data-testid="test-mode-start-pos-x"
          />
        </div>
        <div class="test-mode-input-group">
          <label for="manualY">{$_("testMode.y")}</label>
          <input
            id="manualY"
            class="test-mode-input"
            type="number"
            bind:value={manualY}
            min="0"
            max="7"
            data-testid="test-mode-start-pos-y"
          />
        </div>
        <button
          class="test-mode-square-btn"
          on:click={setManualStartPosition}
          data-testid="test-mode-set-start-pos-btn">{$_("testMode.set")}</button
        >
      </div>
    {/if}
  </div>

  <hr class="test-mode-divider" />

  <div class="test-mode-control-group">
    <h4 class="test-mode-group-title">{$_("testMode.computerMove")}</h4>
    <div class="test-mode-btn-group">
      <button
        class="test-mode-row-btn"
        on:click={() => setComputerMoveMode("random")}
        class:active={$testModeStore.computerMoveMode === "random"}
        data-testid="test-mode-computer-move-random-btn"
        >{$_("testMode.random")}</button
      >
    </div>
    <div class="test-mode-directions-3x3">
      <button
        class="test-mode-dir-btn"
        class:active={manualDirection === "up-left"}
        on:click={() => handleDirection("up-left")}
        data-testid="test-mode-dir-btn-up-left">↖</button
      >
      <button
        class="test-mode-dir-btn"
        class:active={manualDirection === "up"}
        on:click={() => handleDirection("up")}
        data-testid="test-mode-dir-btn-up">↑</button
      >
      <button
        class="test-mode-dir-btn"
        class:active={manualDirection === "up-right"}
        on:click={() => handleDirection("up-right")}
        data-testid="test-mode-dir-btn-up-right">↗</button
      >
      <button
        class="test-mode-dir-btn"
        class:active={manualDirection === "left"}
        on:click={() => handleDirection("left")}
        data-testid="test-mode-dir-btn-left">←</button
      >
      <div class="placeholder"></div>
      <button
        class="test-mode-dir-btn"
        class:active={manualDirection === "right"}
        on:click={() => handleDirection("right")}
        data-testid="test-mode-dir-btn-right">→</button
      >
      <button
        class="test-mode-dir-btn"
        class:active={manualDirection === "down-left"}
        on:click={() => handleDirection("down-left")}
        data-testid="test-mode-dir-btn-down-left">↙</button
      >
      <button
        class="test-mode-dir-btn"
        class:active={manualDirection === "down"}
        on:click={() => handleDirection("down")}
        data-testid="test-mode-dir-btn-down">↓</button
      >
      <button
        class="test-mode-dir-btn"
        class:active={manualDirection === "down-right"}
        on:click={() => handleDirection("down-right")}
        data-testid="test-mode-dir-btn-down-right">↘</button
      >
    </div>
    <div class="test-mode-manual-move-controls">
      <div class="test-mode-input-group">
        <label for="manualDist">{$_("testMode.distance")}</label>
        <input
          id="manualDist"
          class="test-mode-input"
          type="number"
          bind:value={manualDistance}
          min="1"
          max="7"
          data-testid="test-mode-move-dist-input"
        />
      </div>
      <button
        class="test-mode-square-btn"
        on:click={setManualMoveProperties}
        data-testid="test-mode-set-move-dist-btn">{$_("testMode.set")}</button
      >
    </div>
  </div>
</div>

<style>
  .test-mode-widget {
    background: var(--background-alt, #1e1e1e);
    border-radius: var(--unified-border-radius, 12px);
    padding: 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    width: 150px;
  }
  .test-mode-widget-title {
    font-weight: 700;
    text-align: center;
    color: var(--text-color, #fff);
    margin-bottom: 0.25rem;
  }
  .test-mode-control-group {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .test-mode-group-title {
    font-weight: 500;
    color: var(--text-muted, #aaa);
    border-bottom: var(--global-border-width) solid var(--border-color, #444);
    padding-bottom: 0.125rem;
    margin-bottom: 0.25rem;
  }
  .test-mode-btn-group {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.25rem;
  }
  .test-mode-row-btn {
    background: var(--control-bg);
    border: var(--global-border-width) solid var(--border-color);
    color: var(--text-color);
    padding: 0 0.4rem;
    line-height: 1.5;
    font-size: 0.8rem;
    border-radius: 12px;
    text-align: center;
    cursor: pointer;
    transition:
      background-color 0.2s,
      border-color 0.2s;
    min-height: 32px;
  }
  .test-mode-row-btn:hover {
    border-color: var(--control-selected);
  }
  .test-mode-row-btn.active {
    background: var(--control-selected);
    color: var(--accent-text, #000000);
    border-color: var(--control-selected);
  }
  .test-mode-manual-coords {
    display: grid;
    grid-template-columns: repeat(2, 1fr) 30px;
    gap: 0.25rem;
    align-items: end;
  }
  .test-mode-input-group {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.125rem;
  }
  .test-mode-input-group label {
    font-size: 0.7rem;
    color: var(--text-muted, #aaa);
  }
  .test-mode-input {
    width: 100%;
    background: var(--input-bg, #111);
    border: var(--global-border-width) solid var(--input-border, #555);
    color: var(--text-color, #fff);
    border-radius: 12px;
    padding: 0.1rem 0;
    text-align: center;
    font-size: 0.8rem;
    -moz-appearance: textfield;
    appearance: textfield;
    transition:
      border-color 0.2s,
      box-shadow 0.2s;
  }
  .test-mode-input:focus {
    outline: none;
    border-color: var(--control-selected, #007acc);
    box-shadow: 0 0 0 2px var(--control-selected-shadow, rgba(0, 122, 204, 0.5));
  }
  .test-mode-input::-webkit-outer-spin-button,
  .test-mode-input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  .test-mode-square-btn {
    background: var(--control-bg);
    border: var(--global-border-width) solid var(--border-color);
    color: var(--text-color);
    border-radius: 12px;
    width: 100%;
    height: 100%;
    padding: 0;
    font-size: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
  .test-mode-divider {
    border: none;
    border-top: var(--global-border-width) solid var(--border-color);
    margin: 0.125rem 0;
  }
  .test-mode-directions-3x3 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.125rem;
  }
  .test-mode-dir-btn {
    background: var(--control-bg);
    border: var(--global-border-width) solid var(--border-color);
    color: var(--text-color);
    border-radius: 16px;
    min-width: 100%;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: "M PLUS Rounded 1c", sans-serif !important;
  }
  .test-mode-dir-btn.active {
    background: var(--control-selected);
    color: var(--accent-text, #000000);
  }
  .test-mode-manual-move-controls {
    display: grid;
    grid-template-columns: 1fr 30px;
    gap: 0.25rem;
    align-items: end;
  }
</style>
