<script>
  import { modalState, modalStore } from '$lib/stores/modalStore.js';
  import { startReplay } from '$lib/stores/gameStore.js';
  import { logStore } from '$lib/stores/logStore.js';
  import { _ } from 'svelte-i18n';
  import SvgIcons from './SvgIcons.svelte';
  import FAQModal from './FAQModal.svelte';

  const modal_data = $derived(modalState);

  const details = $derived(() => (typeof $modal_data.content === 'object' && $modal_data.content !== null && $modal_data.content.scoreDetails)
    ? /** @type {any} */ ($modal_data.content.scoreDetails)
    : null);

  /** @type {HTMLButtonElement | null} */
  let hotBtn = $state(null);

  $effect(() => {
    if ($modal_data.isOpen && hotBtn) {
      setTimeout(() => {
        hotBtn?.focus();
      }, 50);
    }
  });

  function onModalKeydown(/** @type {any} */e) {
    if (!$modal_data.isOpen || !$modal_data.buttons) return;
    const idx = $modal_data.buttons.findIndex(b => b.isHot);
    if (idx !== -1 && (e.key === 'Enter' || e.key === ' ' || e.key === '5')) {
      e.preventDefault();
      e.stopPropagation();
      const button = $modal_data.buttons[idx];
      if (button && typeof button.onClick === 'function') {
        button.onClick();
      } else {
        modalStore.closeModal();
      }
    }
  }

  function onOverlayClick(/** @type {Event} */ e) {
    if ($modal_data.buttons && $modal_data.buttons.length === 2 && $modal_data.buttons.every(btn => typeof btn.onClick === 'function')) {
      return;
    }
    const target = /** @type {HTMLElement|null} */(e.target);
    if (target && target.classList.contains('modal-overlay')) {
      logStore.addLog('Закриття модального вікна (overlay)', 'info');
      modalStore.closeModal();
    }
  }
</script>

{#if $modal_data.isOpen}
  <div class="modal-overlay screen-overlay-backdrop" role="button" tabindex="0" aria-label={$_('modal.ok')} onclick={e => {
    if ($modal_data.titleKey === 'modal.gameOverTitle') return;
    onOverlayClick(e);
  }} onkeydown={onModalKeydown}>
    <div class="modal-window">
      <div class="modal-header">
        {#if $modal_data.titleKey === 'modal.gameOverTitle'}
          <span class="modal-victory-icon"><SvgIcons name="queen" /></span>
        {/if}
        <h2 class="modal-title">{$modal_data.titleKey ? $_($modal_data.titleKey) : $modal_data.title}</h2>
        {#if !(($modal_data.buttons && $modal_data.buttons.length === 2 && $modal_data.buttons.every(btn => typeof btn.onClick === 'function')) || $modal_data.titleKey === 'modal.gameOverTitle' || ($modal_data.buttons && $modal_data.buttons.length === 1))}
          <button class="modal-close" onclick={() => { logStore.addLog('Закриття модального вікна (X)', 'info'); modalStore.closeModal(); }}>&times;</button>
        {/if}
      </div>
      <div class="modal-content">
        
        {#if $modal_data.component}
          <svelte:component this={$modal_data.component} />
        {:else if typeof $modal_data.content === 'object' && $modal_data.content?.isFaq}
          <FAQModal />
        {:else if $modal_data.contentKey || (typeof $modal_data.content === 'string' && $modal_data.content)}
          <p class="reason">
            {#if $modal_data.contentKey}
              {@html $_($modal_data.contentKey)}
            {:else if typeof $modal_data.content === 'string'}
              {@html $modal_data.content}
            {/if}
          </p>
        {/if}

        {#if details}
          {#if typeof $modal_data.content === 'object' && $modal_data.content !== null}
            <p class="reason">{$modal_data.content.reason}</p>
          {/if}
          {#if details()}
            <div class="score-detail-row">{$_('modal.scoreDetails.baseScore')} <span>{details().baseScore}</span></div>
            {#if details().sizeBonus > 0}
              <div class="score-detail-row">{$_('modal.scoreDetails.sizeBonus')} <span>+{details().sizeBonus}</span></div>
            {/if}
            {#if details().blockModeBonus > 0}
              <div class="score-detail-row">{$_('modal.scoreDetails.blockModeBonus')} <span>+{details().blockModeBonus}</span></div>
            {/if}
            {#if details().jumpBonus > 0}
              <div class="score-detail-row">{$_('modal.scoreDetails.jumpBonus')} <span>+{details().jumpBonus}</span></div>
            {/if}
            {#if details().noMovesBonus > 0}
              <div class="score-detail-row">{$_('modal.scoreDetails.noMovesBonus')} <span>+{details().noMovesBonus}</span></div>
            {/if}
            {#if details().finishBonus > 0}
              <div class="score-detail-row">{$_('modal.scoreDetails.finishBonus')} <span>+{details().finishBonus}</span></div>
            {/if}
            {#if details().totalPenalty > 0}
              <div class="score-detail-row penalty">{$_('modal.scoreDetails.penalty')} <span>-{details().totalPenalty}</span></div>
            {/if}
            <div class="final-score-row">
              <span class="score-label">{$_('modal.scoreDetails.finalScore')}</span>
              <span class="score-value">{details().totalScore}</span>
            </div>
          {/if}
        {:else if typeof $modal_data.content === 'object' && $modal_data.content !== null && $modal_data.content.score}
          <p class="reason">{$modal_data.content.reason}</p>
          <div class="final-score-row">
            <span class="score-label">{$_('modal.scoreDetails.yourScore')}</span>
            <span class="score-value">{$modal_data.content.score}</span>
          </div>
        {/if}
      </div>
      <div class="modal-buttons">
        {#each $modal_data.buttons as btn, i}
          {#if btn.isHot}
            <button
              class="modal-btn-generic"
              class:primary={btn.primary && !btn.customClass}
              class:blue-btn={btn.customClass === 'blue-btn'}
              class:green-btn={btn.customClass === 'green-btn'}
              onclick={() => { logStore.addLog(`Клік по кнопці модалки: ${btn.textKey ? $_(btn.textKey) : btn.text}`, 'info'); (btn.onClick || modalStore.closeModal)(); }}
              aria-label={btn.textKey ? $_(btn.textKey) : btn.text}
              bind:this={hotBtn}
            >{btn.textKey ? $_(btn.textKey) : btn.text}</button>
          {:else}
            <button
              class="modal-btn-generic"
              class:primary={btn.primary && !btn.customClass}
              class:blue-btn={btn.customClass === 'blue-btn'}
              class:green-btn={btn.customClass === 'green-btn'}
              onclick={() => { logStore.addLog(`Клік по кнопці модалки: ${btn.textKey ? $_(btn.textKey) : btn.text}`, 'info'); (btn.onClick || modalStore.closeModal)(); }}
              aria-label={btn.textKey ? $_(btn.textKey) : btn.text}
            >{btn.textKey ? $_(btn.textKey) : btn.text}</button>
          {/if}
        {/each}
        {#if !$modal_data.buttons.length}
          <button class="modal-btn-generic" onclick={() => { logStore.addLog('Закриття модального вікна (OK)', 'info'); modalStore.closeModal(); }}>{$_('modal.ok')}</button>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
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
  background: rgba(40, 10, 35, 0.85);
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
  overflow-y: auto;
  padding: 20px 24px;
  color: var(--text-primary, #fff);
  background: transparent;
}
.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-shrink: 0;
  background: transparent;
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
.score-detail-row.penalty {
  color: #f44336;
}
.score-detail-row.penalty span {
  color: #f44336;
  font-weight: bold;
}
.final-score-row {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.15);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.score-label {
  font-size: 1.1em;
  color: var(--text-secondary, #ccc);
  font-weight: 500;
}
.score-value {
  font-size: 3em;
  font-weight: 700;
  color: var(--text-accent, #ff9800);
  line-height: 1;
}
.modal-buttons {
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
    background: #4caf50;
    color: #fff;
    box-shadow: 0 2px 12px 0 #4caf5040;
}

.modal-btn-generic.primary:hover, .modal-btn-generic.green-btn:hover {
    background: #43a047;
}

.modal-btn-generic.blue-btn {
    background: #2196f3;
    color: #fff;
    box-shadow: 0 2px 12px 0 #2196f340;
}

.modal-btn-generic.blue-btn:hover {
    background: #1976d2;
}
.reason {
  font-size: 1.1em;
  color: var(--text-secondary, #ccc);
  margin-bottom: 24px;
  margin-top: 0;
  text-align: center;
  white-space: pre-line;
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
  .modal-buttons {
    padding: 16px;
  }
}
</style> 