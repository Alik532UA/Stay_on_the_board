<script>
  import { modalState, modalStore } from '$lib/stores/modalStore.js';
  import { logStore } from '$lib/stores/logStore.js';
  import { _ } from 'svelte-i18n';
  import SvgIcons from './SvgIcons.svelte';

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
        {#if !(($modal_data.buttons && $modal_data.buttons.length === 2 && $modal_data.buttons.every(btn => typeof btn.onClick === 'function')) || $modal_data.titleKey === 'modal.gameOverTitle')}
          <button class="modal-close" onclick={() => { logStore.addLog('Закриття модального вікна (X)', 'info'); modalStore.closeModal(); }}>&times;</button>
        {/if}
      </div>
      <div class="modal-content">
        
        {#if $modal_data.contentKey || (typeof $modal_data.content === 'string' && $modal_data.content)}
          <div class="modal-info">
            {$modal_data.contentKey ? $_($modal_data.contentKey) : $modal_data.content}
          </div>
        {/if}

        {#if details}
          {#if typeof $modal_data.content === 'object' && $modal_data.content !== null}
            <p class="reason">{$modal_data.content.reason}</p>
          {/if}
          {#if details()}
            <div class="score-breakdown">
              <div>{$_('modal.scoreDetails.baseScore')} <span>{details().baseScore}</span></div>
              {#if details().sizeBonus > 0}
                <div>{$_('modal.scoreDetails.sizeBonus')} <span>+{details().sizeBonus}</span></div>
              {/if}
              {#if details().blockModeBonus > 0}
                <div>{$_('modal.scoreDetails.blockModeBonus')} <span>+{details().blockModeBonus}</span></div>
              {/if}
              {#if details().jumpBonus > 0}
                <div>{$_('modal.scoreDetails.jumpBonus')} <span>+{details().jumpBonus}</span></div>
              {/if}
              {#if details().noMovesBonus > 0}
                <div>{$_('modal.scoreDetails.noMovesBonus')} <span>+{details().noMovesBonus}</span></div>
              {/if}
              {#if details().finishBonus > 0}
                <div>{$_('modal.scoreDetails.finishBonus')} <span>+{details().finishBonus}</span></div>
              {/if}
              {#if details().totalPenalty > 0}
                <div class="penalty">{$_('modal.scoreDetails.penalty')} <span>-{details().totalPenalty}</span></div>
              {/if}
            </div>
            <div class="final-score-container">
              <span class="score-label">{$_('modal.scoreDetails.finalScore')}</span>
              <span class="score-value">{details().totalScore}</span>
            </div>
          {/if}
        {:else if typeof $modal_data.content === 'object' && $modal_data.content !== null && $modal_data.content.score}
          <p class="reason">{$modal_data.content.reason}</p>
          <div class="final-score-container">
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
/* Styles remain unchanged */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal-victory-icon {
  font-size: 2.5em;
  margin-right: 12px;
  vertical-align: middle;
  filter: drop-shadow(0 2px 8px #ffeb3b88);
}
.modal-window {
  border-radius: 18px;
  min-width: 280px;
  max-width: 90vw;
  padding: 0;
  box-shadow: none;
  text-align: center;
  background: none;
  width: 90vw;
  max-width: 420px;
  box-sizing: border-box;
}
.modal-content {
  background: rgba(40, 10, 35, 0.65);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37), 0 2px 16px 0 rgba(80,0,80,0.10);
  border-radius: 18px;
  padding: 24px 16px;
  width: 100%;
  box-sizing: border-box;
  max-width: 420px;
  margin: 0 auto;
  max-height: 90vh;
  overflow: hidden;
  position: relative;
  color: var(--text-primary, #fff);
  transform: scale(0.95);
  opacity: 0;
  animation: modalFadeIn 0.3s ease-out forwards;
  display: flex;
  flex-direction: column;
  align-items: center;
}
@keyframes modalFadeIn {
  to {
    transform: scale(1);
    opacity: 1;
  }
}
.modal-header {
  background: transparent;
  padding: 24px 16px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 1.25em;
  font-weight: bold;
  color: var(--text-accent, #ffbe0b);
}
.modal-title {
  margin: 0;
  font-size: 2em;
  font-weight: 800;
  color: #fffde7;
  text-align: center;
  flex: 1;
  letter-spacing: 0.01em;
  line-height: 1.2;
}
.modal-close {
  color: rgba(255, 255, 255, 0.7);
  background: none;
  border: none;
  font-size: 2em;
  cursor: pointer;
  transition: color 0.2s ease;
  padding: 0 12px;
}
.modal-close:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}
.final-score-container {
  background-color: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px 12px;
  margin: 0 auto;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 100%;
  box-sizing: border-box;
}
.score-label {
  font-size: 1em;
  color: var(--text-secondary, #ccc);
  font-weight: 500;
}
.score-value {
  font-size: 2.5em;
  font-weight: 700;
  color: var(--text-accent, #ff9800);
  line-height: 1;
}
.modal-buttons {
    justify-content: center;
    display: flex;
    background: transparent;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    padding: 20px 0 24px 0;
    gap: 18px;
    width: 100%;
    box-sizing: border-box;
    margin-top: 8px;
}

.modal-btn-generic {
    margin: 0 8px;
    padding: 8px 26px;
    font-size: 1.08em;
    border-radius: 8px;
    border: 1.5px solid #eee;
    background: #fff;
    color: #222;
    cursor: pointer;
    transition: background 0.2s, color 0.2s, box-shadow 0.2s, transform 0.15s;
    font-weight: 600;
    box-shadow: 0 2px 8px 0 rgba(0,0,0,0.08);
    outline: none;
    min-width: 120px;
    text-align: center;
}

.modal-btn-generic:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px 0 rgba(0,0,0,0.12);
}

.modal-btn-generic.primary {
    background: #4caf50;
    color: #fff;
    border-color: #388e3c;
    box-shadow: 0 2px 12px 0 #4caf5040;
}

.modal-btn-generic.primary:hover {
    background: #43a047;
}

.modal-btn-generic.blue-btn {
    background: #2196f3;
    color: #fff;
    border-color: #1976d2;
    box-shadow: 0 2px 12px 0 #2196f340;
}

.modal-btn-generic.blue-btn:hover {
    background: #1976d2;
}

.modal-btn-generic.green-btn {
    background: #4caf50;
    color: #fff;
    border-color: #388e3c;
    box-shadow: 0 2px 12px 0 #4caf5040;
}

.modal-btn-generic.green-btn:hover {
    background: #43a047;
}
.reason {
  font-size: 1.1em;
  color: var(--text-secondary, #ccc);
  margin-bottom: 20px;
  margin-top: 32px;
}
.modal-content p, .modal-content .reason {
  margin: 0 0 16px 0;
  text-align: center;
  font-size: 1.08em;
}
.score-breakdown {
  text-align: left;
  margin: 20px auto;
  padding: 16px;
  background: rgba(0,0,0,0.1);
  border-radius: 8px;
  width: 100%;
  box-sizing: border-box;
  font-size: 0.9em;
  color: var(--text-secondary);
}
.score-breakdown div {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
}
.score-breakdown span {
  font-weight: bold;
  color: var(--text-primary);
}
.score-breakdown .penalty {
  color: #f44336;
}
.score-breakdown .penalty span {
  color: #f44336;
  font-weight: bold;
}
.modal-info {
  background: rgba(30, 16, 40, 0.32);
  color: #fff;
  border-radius: 10px;
  padding: 12px 18px 10px 18px;
  margin: 0 0 18px 0;
  font-size: 1.08em;
  text-align: center;
  box-shadow: none;
  border: none;
  max-width: 95vw;
}
@media (max-width: 400px) {
  .modal-buttons {
    flex-direction: column;
    gap: 12px;
  }
  .modal-btn-generic {
    width: 100%;
    margin: 0;
  }
}
</style> 