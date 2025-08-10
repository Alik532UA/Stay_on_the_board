<script lang="ts">
  import { settingsStore } from '$lib/stores/settingsStore';
  import { fade } from 'svelte/transition';
  import SvgIcons from '$lib/components/SvgIcons.svelte';

  // SoC: Компонент приймає готові дані, не займаючись їх отриманням.
  export let title: string;
  export let labels: string[];

  const icons = ['visibility_off', 'grid_on', 'view_in_ar', 'rule'];

  // SSoT: Рівень видимості є похідним від централізованого settingsStore.
  $: visibilityLevel = (() => {
    if (!$settingsStore.showBoard) return 1;
    if (!$settingsStore.showPiece) return 2;
    if (!$settingsStore.showMoves) return 3;
    return 4;
  })();

  // UDF: Єдина функція для оновлення стану.
  function handleChange(e: Event) {
    const level = parseInt((e.target as HTMLInputElement).value);
    let newSettings = {};
    switch (level) {
      case 1: newSettings = { showBoard: false, showPiece: false, showMoves: false }; break;
      case 2: newSettings = { showBoard: true, showPiece: false, showMoves: false }; break;
      case 3: newSettings = { showBoard: true, showPiece: true, showMoves: false }; break;
      case 4: newSettings = { showBoard: true, showPiece: true, showMoves: true }; break;
    }
    settingsStore.updateSettings(newSettings);
  }
</script>

<div class="visibility-slider-widget" transition:fade={{ duration: 300 }}>
  <h3 class="widget-title">{title}</h3>
  <div class="slider-container">
    <input
      type="range"
      id="visibility-slider"
      min="1"
      max="4"
      value={visibilityLevel}
      on:input={handleChange}
      class="slider"
    />
    <div class="slider-labels">
      {#each labels as label, i}
        <span class:active={visibilityLevel === i + 1}>
          <SvgIcons name={icons[i]} />
          {label}
        </span>
      {/each}
    </div>
  </div>
</div>

<style>
  .visibility-slider-widget {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    background: var(--bg-secondary);
    border-radius: var(--unified-border-radius);
    box-shadow: var(--dynamic-widget-shadow) var(--current-player-shadow-color);
    border: var(--unified-border);
    backdrop-filter: var(--unified-backdrop-filter);
  }
  .widget-title {
    font-weight: bold;
    color: var(--text-primary);
    margin: 0;
    text-align: center;
    font-size: 1.1em;
  }
  .slider-container {
    display: flex;
    flex-direction: column;
  }
  .slider {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 8px;
    border-radius: 5px;
    background: var(--control-bg);
    outline: none;
    opacity: 0.8;
  }
  .slider:hover {
    opacity: 1;
  }
  .slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--confirm-action-bg);
    cursor: pointer;
    transition: transform 0.2s ease;
  }
  .slider:hover::-webkit-slider-thumb {
    transform: scale(1.1);
  }
  .slider::-moz-range-thumb {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--confirm-action-bg);
    cursor: pointer;
  }
  .slider-labels {
    display: flex;
    justify-content: space-between;
    font-size: 0.8rem;
    color: var(--text-secondary);
    margin-top: 8px;
    padding: 0 4px;
  }
  .slider-labels span {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    transition: color 0.2s, font-weight 0.2s;
    text-align: center;
    flex: 1;
  }
  .slider-labels span.active {
    color: var(--text-primary);
    font-weight: bold;
  }
</style>