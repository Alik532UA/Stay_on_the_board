<script>
  import { modalState, modalStore } from '$lib/stores/modalStore.js';
  import { logStore } from '$lib/stores/logStore.js';
  import { _ } from 'svelte-i18n';
  import SvgIcons from './SvgIcons.svelte';
  import FAQModal from './FAQModal.svelte';
  import { gameState } from '$lib/stores/gameState.js';
  import { onMount } from 'svelte';
  import { audioService } from '$lib/services/audioService.js';
  import DontShowAgainCheckbox from './DontShowAgainCheckbox.svelte';

  /** @type {HTMLButtonElement | null} */
  let hotBtn = null;

  let expertVolume = 0.3;
  let volumePercentage = 30;

  onMount(() => {
    expertVolume = audioService.loadVolume();
    return () => {
      audioService.pause();
    };
  });

  // Реактивний блок для керування логікою
  $: {
    const shouldPlay = $modalState.isOpen && $modalState.titleKey === 'modal.expertModeTitle';

    // Оновлюємо гучність, зберігаємо її та оновлюємо CSS-змінну для стилізації
    audioService.setVolume(expertVolume);
    audioService.saveVolume(expertVolume);
    volumePercentage = expertVolume * 100;

    if (shouldPlay) {
      audioService.play();
    } else {
      audioService.pause();
    }
  }

  $: if ($modalState.isOpen && hotBtn) {
    setTimeout(() => {
      if (hotBtn && typeof hotBtn.focus === 'function') hotBtn.focus();
    }, 50);
  }

  function onModalKeydown(/** @type {any} */e) {
    if (!$modalState.isOpen || !$modalState.buttons) return;
    const idx = $modalState.buttons.findIndex(b => b.isHot);
    if (idx !== -1 && (e.key === 'Enter' || e.key === ' ' || e.code === 'Numpad5')) {
      e.preventDefault();
      e.stopPropagation();
      const button = $modalState.buttons[idx];
      if (button && typeof button.onClick === 'function') {
        button.onClick();
      } else {
        modalStore.closeModal();
      }
    }
  }

  function onOverlayClick(/** @type {any} */ e) {
    if (!$modalState.closable) return;
    const target = /** @type {HTMLElement|null} */(e.target);
    if (target && target.classList.contains('modal-overlay')) {
      logStore.addLog('Закриття модального вікна (overlay)', 'info');
      modalStore.closeModal();
    }
  }
</script>

{#if $modalState.isOpen}
  <div class="modal-overlay screen-overlay-backdrop" role="button" tabindex="0" aria-label={$_('modal.ok')} onclick={e => {
    if (!$modalState.closable) return;
    onOverlayClick(e);
  }} onkeydown={onModalKeydown}>
    <div class="modal-window">
      <div class="modal-header">
        {#if $modalState.titleKey === 'modal.expertModeTitle'}
          <!-- Контейнер для повзунка, якому ми передаємо CSS-змінну -->
          <div class="volume-control-container" style="--volume-percentage: {volumePercentage}%; position: relative;">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              bind:value={expertVolume}
              class="volume-slider"
              aria-label={$_('voiceSettings.volume')}
            />
            <span class="volume-thumb-svg" style="left: calc((100% - 32px) * {expertVolume});">
              <SvgIcons name="boxing-glove-pictogram-1" />
            </span>
            <span class="volume-label">{$_('voiceSettings.volumeLabel')}: {volumePercentage.toFixed(0)}%</span>
          </div>
        {/if}

        <div class="modal-title-wrapper">
          {#if $modalState.titleKey === 'modal.gameOverTitle'}
            <span class="modal-victory-icon"><SvgIcons name="queen" /></span>
          {/if}
          <h2 class="modal-title">{$modalState.titleKey ? $_($modalState.titleKey) : $modalState.title}</h2>
        </div>

        {#if !(($modalState.buttons && $modalState.buttons.length === 2 && $modalState.buttons.every(btn => typeof btn.onClick === 'function')) || $modalState.titleKey === 'modal.gameOverTitle' || ($modalState.buttons && $modalState.buttons.length === 1))}
          {#if $modalState.closable}
            <button class="modal-close" onclick={() => { logStore.addLog('Закриття модального вікна (X)', 'info'); modalStore.closeModal(); }}>×</button>
          {/if}
        {/if}
      </div>
      <div class="modal-content">
        {#if typeof $modalState.content === 'object' && $modalState.content?.reason}
          <p class="reason">{$modalState.content.reason}</p>
        {/if}
        {#if $modalState.component}
          <svelte:component this={$modalState.component} />
        {:else if typeof $modalState.content === 'object' && $modalState.content?.isFaq}
          <FAQModal />
        {:else if typeof $modalState.content === 'object' && $modalState.content?.key && $modalState.content?.actions}
          <p class="reason">{$_('modal.keyConflictContent', { values: { key: $modalState.content.key } })}</p>
        {:else if $modalState.contentKey || (typeof $modalState.content === 'string' && $modalState.content)}
          <p class="reason">
            {#if $modalState.contentKey}
              {@html $_($modalState.contentKey)}
            {:else if typeof $modalState.content === 'string'}
              {@html $modalState.content}
            {/if}
          </p>
        {/if}

        {#if $gameState.isGameOver}
          <div class="score-details-container">
            <div class="score-detail-row">{$_('modal.scoreDetails.baseScore')} <span>{$gameState.baseScore ?? 0}</span></div>
            {#if ($gameState.sizeBonus ?? 0) > 0}
              <div class="score-detail-row">{$_('modal.scoreDetails.sizeBonus')} <span>+{($gameState.sizeBonus ?? 0)}</span></div>
            {/if}
            {#if ($gameState.blockModeBonus ?? 0) > 0}
              <div class="score-detail-row">{$_('modal.scoreDetails.blockModeBonus')} <span>+{($gameState.blockModeBonus ?? 0)}</span></div>
            {/if}
            {#if ($gameState.jumpBonus ?? 0) > 0}
              <div class="score-detail-row">{$_('modal.scoreDetails.jumpBonus')} <span>+{($gameState.jumpBonus ?? 0)}</span></div>
            {/if}
            {#if ($gameState.noMovesBonus ?? 0) > 0}
              <div class="score-detail-row">{$_('modal.scoreDetails.noMovesBonus')} <span>+{($gameState.noMovesBonus ?? 0)}</span></div>
            {/if}
            {#if ($modalState.titleKey === 'modal.gameOverTitle' && ($gameState.finishBonus ?? 0) > 0)}
              <div class="score-detail-row">{$_('modal.scoreDetails.finishBonus')} <span>+{($gameState.finishBonus ?? 0)}</span></div>
            {/if}
            {#if ($gameState.totalPenalty ?? 0) > 0}
              <div class="score-detail-row penalty">{$_('modal.scoreDetails.penalty')} <span>-{($gameState.totalPenalty ?? 0)}</span></div>
            {/if}
          </div>
          <div class="final-score-container">
            <div class="final-score-label">{$_('modal.scoreDetails.finalScore')}</div>
            <div class="final-score-value">{$gameState.totalScore ?? 0}</div>
          </div>
        {/if}
      </div>
      <div class="modal-action-buttons">
        {#each $modalState.buttons as btn, i (i)}
          {#if btn.isHot && !$modalState.buttons.slice(0, i).some(b => b.isHot)}
            <button
              class="modal-btn-generic"
              class:primary={btn.primary && !btn.customClass}
              class:blue-btn={btn.customClass === 'blue-btn'}
              class:green-btn={btn.customClass === 'green-btn'}
              class:danger-btn={btn.customClass === 'danger-btn'}
              bind:this={hotBtn}
              onclick={() => { logStore.addLog(`Клік по кнопці модалки: ${btn.textKey ? $_(btn.textKey) : btn.text}`, 'info'); (btn.onClick || modalStore.closeModal)(); }}
              aria-label={btn.textKey ? $_(btn.textKey) : btn.text}
            >
              {btn.textKey ? $_(btn.textKey) : btn.text}
            </button>
          {:else}
            <button
              class="modal-btn-generic"
              class:primary={btn.primary && !btn.customClass}
              class:blue-btn={btn.customClass === 'blue-btn'}
              class:green-btn={btn.customClass === 'green-btn'}
              class:danger-btn={btn.customClass === 'danger-btn'}
              onclick={() => { logStore.addLog(`Клік по кнопці модалки: ${btn.textKey ? $_(btn.textKey) : btn.text}`, 'info'); (btn.onClick || modalStore.closeModal)(); }}
              aria-label={btn.textKey ? $_(btn.textKey) : btn.text}
            >
              {btn.text ? btn.text : (btn.textKey ? $_(btn.textKey) : '')}
            </button>
          {/if}
        {/each}
        {#if $modalState.titleKey === 'gameModes.title' || $modalState.titleKey === 'modal.expertModeTitle'}
          <DontShowAgainCheckbox />
        {/if}
        <slot />
      </div>
    </div>
  </div>
{/if}

<style>
/* ... (попередні стилі залишаються, але стилі для повзунка повністю замінені) ... */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}
.modal-victory-icon {
  font-size: 1.5em;
  margin-right: 8px;
  vertical-align: middle;
  filter: drop-shadow(0 2px 8px #ffeb3b88);
}
.modal-window {
  background: var(--bg-secondary);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
  border-radius: 24px;
  width: 100%;
  max-width: 400px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transform: scale(0.95);
  opacity: 0;
  animation: modalFadeIn 0.3s ease-out forwards;
}
@keyframes modalFadeIn {
  to {
    transform: scale(1);
    opacity: 1;
  }
}
.modal-content {
  flex: 1;
  padding: 20px 24px;
  color: var(--text-primary, #fff);
  background: transparent;
}
.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
  background: transparent;
  position: relative;
}
.modal-title-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal-title {
  margin: 0;
  font-size: 1.8em;
  font-weight: 700;
  color: #fffde7;
  text-align: center;
  flex: 1;
}
.modal-close {
  position: absolute;
  top: 10px;
  right: 10px;
  color: rgba(255, 255, 255, 0.7);
  background: none;
  border: none;
  font-size: 2em;
  cursor: pointer;
  transition: color 0.2s ease;
  padding: 0;
  width: 44px;
  height: 44px;
  line-height: 44px;
  z-index: 1;
}
.modal-close:hover {
  color: #fff;
}

/* --- НОВІ, ПОКРАЩЕНІ СТИЛІ ДЛЯ ПОВЗУНКА ГУЧНОСТІ --- */
.volume-control-container {
  width: 85%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  position: relative;
}
.volume-label {
  font-size: 0.9em;
  color: #aaa;
  font-weight: 500;
}
.volume-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  cursor: pointer;
  outline: none;
  border-radius: 15px;
  height: 20px; /* Висота для клікабельної зони */
  background: transparent; /* Фон самого інпута прозорий */
}

/* --- Трек (доріжка) повзунка для Webkit (Chrome, Safari) --- */
.volume-slider::-webkit-slider-runnable-track {
  height: 14px;
  background: linear-gradient(to right, var(--confirm-action-bg) var(--volume-percentage), #3a3f44 var(--volume-percentage));
  border-radius: 7px;
  border: 1px solid rgba(0, 0, 0, 0.4);
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.2);
}

/* --- Бігунок (thumb) для Webkit --- */
.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  margin-top: -4px;
  height: 32px;
  width: 32px;
  background: transparent;
  border: none;
  box-shadow: none;
  transition: transform 0.1s ease;
}
.volume-slider:hover::-webkit-slider-thumb {
  transform: scale(1.1);
}

/* --- Трек (доріжка) повзунка для Firefox --- */
.volume-slider::-moz-range-track {
  height: 14px;
  background: linear-gradient(to right, var(--confirm-action-bg) var(--volume-percentage), #3a3f44 var(--volume-percentage));
  border-radius: 7px;
  border: 1px solid rgba(0, 0, 0, 0.4);
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.2);
}

/* --- Бігунок (thumb) для Firefox --- */
.volume-slider::-moz-range-thumb {
  height: 32px;
  width: 32px;
  background: transparent;
  border: none;
  box-shadow: none;
}
.volume-slider:hover::-moz-range-thumb {
  transform: scale(1.1);
}

.volume-thumb-svg {
  position: absolute;
  top: 50%;
  left: 0;
  transform: translateY(calc(-50% - 16px)) rotate(130deg);
  pointer-events: none;
  z-index: 2;
  width: 32px;
  height: 32px;
  /* transition: left 0.2s; */
  filter: drop-shadow(0 0 0.8px #4caf50) drop-shadow(0 0 0.8px #4caf50) drop-shadow(0 0 0.8px #4caf50) drop-shadow(0 0 0.8px #4caf50);
}
/* --- Кінець стилів для повзунка --- */

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
.score-detail-row span {
  font-weight: bold;
  color: var(--text-primary);
}
.modal-btn-generic {
    margin: 0;
    padding: 12px 26px;
    font-size: 1.1em;
    border-radius: 12px;
    border: none;
    background: #fff;
    color: #222;
    cursor: pointer;
    transition: background 0.2s, color 0.2s, box-shadow 0.2s, transform 0.15s;
    font-weight: 700;
    box-shadow: 0 2px 8px 0 rgba(0,0,0,0.08);
    outline: none;
    width: 100%;
    text-align: center;
}
.modal-btn-generic:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px 0 rgba(0,0,0,0.12);
}
.modal-btn-generic.primary, .modal-btn-generic.green-btn {
    background: var(--confirm-action-bg);
    color: var(--confirm-action-text);
    box-shadow: 0 2px 12px 0 var(--shadow-color);
}
.modal-btn-generic.blue-btn {
    background: var(--info-action-bg);
    color: var(--info-action-text);
    box-shadow: 0 2px 12px 0 var(--shadow-color);
}
.modal-btn-generic.danger-btn {
    background: var(--error-color);
    color: #fff;
    box-shadow: 0 2px 12px 0 var(--shadow-color);
}
.reason {
  font-size: 1.1em;
  color: var(--text-secondary, #ccc);
  margin-bottom: 24px;
  margin-top: 0;
  text-align: center;
  white-space: pre-line;
}
.score-details-container {
  background: rgba(0,0,0,0.1);
  border-radius: 12px;
  padding: 12px 16px;
  margin-bottom: 20px;
}
.score-detail-row.penalty span {
  color: var(--error-color);
}
.final-score-container {
  background: rgba(0,0,0,0.2);
  border-radius: 12px;
  padding: 16px;
  text-align: center;
}
.final-score-label {
  font-size: 1em;
  color: var(--text-secondary);
  margin-bottom: 8px;
}
.final-score-value {
  font-size: 2.8em;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
}

.modal-action-buttons {
  justify-content: center;
  display: flex;
  flex-direction: column;
  padding: 24px;
  gap: 12px;
  width: 100%;
  box-sizing: border-box;
  flex-shrink: 0;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: transparent;
}

@media (max-width: 480px) {
  .modal-header {
    padding: 20px 16px 12px;
  }
  .modal-title {
    font-size: 1.6em;
  }
  .modal-content {
    padding: 16px;
  }
}
</style>