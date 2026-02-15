<script lang="ts">
  import { slide } from 'svelte/transition';
  import { createEventDispatcher } from 'svelte';
  import { _ } from 'svelte-i18n';

  export let bonusDetails: any;
  export let totalBonus: number;
  export let expanded = false;

  // Використовуємо локальну змінну стану, ініціалізовану пропом
  let isOpen = expanded;

  // Реактивно оновлюємо локальний стан, якщо проп змінюється ззовні
  $: isOpen = expanded;

  const dispatch = createEventDispatcher();

  function toggle() {
    isOpen = !isOpen;
    dispatch('toggle', { isOpen });
  }

  const bonusKeys = [
    'sizeBonus',
    'blockModeBonus',
    'jumpBonus',
    'noMovesBonus',
    'distanceBonus',
    'finishBonus'
  ];

  // Use reactive statements instead of {@const}
  $: fullText = $_('modal.scoreDetails.bonusScore', { values: { bonus: totalBonus } });
  $: parts = fullText.split('+');

</script>

<div class="bonus-expander" class:open={isOpen}>
  <div 
    class="expander-summary" 
    on:click={toggle} 
    on:keydown={e => (e.key === 'Enter' || e.key === ' ') && toggle()} 
    role="button" 
    tabindex="0" 
    aria-expanded={isOpen}
    data-testid="bonus-expander-summary"
  >
    <span class="bonus-score-summary" data-testid="total-bonus-summary">
      {parts[0]}<span class="bonus-value">+{parts[1] || totalBonus}</span>
    </span>
    <span class="arrow" class:open={isOpen} aria-hidden="true"><svg viewBox="0 0 24 24" width="24" height="24"><polyline points="6 9 12 15 18 9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
  </div>
  {#if isOpen}
    <div class="expander-content" transition:slide|local>
      {#each bonusKeys as key}
        {#if bonusDetails[key] > 0}
          <div class="score-detail-row">
            <span>{$_(`modal.scoreDetails.${key}`)}</span>
            <span data-testid={`${key}-value`}>+{bonusDetails[key]}</span>
          </div>
        {/if}
      {/each}
    </div>
  {/if}
</div>

<style>
  .bonus-expander {
    background: rgba(0,0,0,0.1);
    border-radius: 12px;
    margin-bottom: 20px;
    transition: background 0.2s;
  }

  .expander-summary {
    display: flex;
    justify-content: space-between;
    padding: 12px 16px;
    cursor: pointer;
    font-weight: bold;
    color: var(--text-primary);
  }

  .bonus-score-summary {
    font-weight: normal;
    color: var(--text-secondary);
  }

  .bonus-value {
    color: var(--confirm-action-bg);
    font-weight: bold;
    margin-left: 0.5em;
  }

  .arrow {
    transition: transform 0.4s cubic-bezier(0.4,0,0.2,1);
    transform: rotate(0deg);
  }

  .arrow.open {
    transform: rotate(180deg);
  }

  .expander-content {
    padding: 0 16px 12px;
    overflow: hidden;
  }

  .score-detail-row {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    font-size: 1em;
    color: var(--text-secondary);
  }
  .score-detail-row:last-of-type {
    border-bottom: none;
  }
  .score-detail-row span[data-testid$="-value"] {
    font-weight: bold;
    color: var(--text-primary);
  }
</style>