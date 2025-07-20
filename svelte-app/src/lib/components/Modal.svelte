<script>
  import { modalState, modalStore } from '$lib/stores/modalStore.js';
  import { startReplay } from '$lib/stores/gameStore.js';
  import { logStore } from '$lib/stores/logStore.js';
  import { _ } from 'svelte-i18n';
  import SvgIcons from './SvgIcons.svelte';
  import FAQModal from './FAQModal.svelte';

  // Видаляю нестандартні $derived, $state, $effect
  // Використовую стандартний Svelte store синтаксис
  // $modalState — реактивний доступ до store

  $: details = (typeof $modalState.content === 'object' && $modalState.content !== null && $modalState.content.scoreDetails)
    ? $modalState.content.scoreDetails
    : null;

  /** @type {HTMLButtonElement | null} */
  let hotBtn = null;

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
    if ($modalState.buttons && $modalState.buttons.length === 2 && $modalState.buttons.every(btn => typeof btn.onClick === 'function')) {
      return;
    }
    const target = /** @type {HTMLElement|null} */(e.target);
    if (target && target.classList.contains('modal-overlay')) {
      logStore.addLog('Закриття модального вікна (overlay)', 'info');
      modalStore.closeModal();
    }
  }
</script>

{#if $modalState.isOpen}
  <div class="modal-overlay screen-overlay-backdrop" role="button" tabindex="0" aria-label={$_('modal.ok')} onclick={e => {
    if ($modalState.titleKey === 'modal.gameOverTitle') return;
    onOverlayClick(e);
  }} onkeydown={onModalKeydown}>
    <div class="modal-window">
      <div class="modal-header">
        {#if $modalState.titleKey === 'modal.gameOverTitle'}
          <span class="modal-victory-icon"><SvgIcons name="queen" /></span>
        {/if}
        <h2 class="modal-title">{$modalState.titleKey ? $_($modalState.titleKey) : $modalState.title}</h2>
        {#if !(($modalState.buttons && $modalState.buttons.length === 2 && $modalState.buttons.every(btn => typeof btn.onClick === 'function')) || $modalState.titleKey === 'modal.gameOverTitle' || ($modalState.buttons && $modalState.buttons.length === 1))}
          <button class="modal-close" onclick={() => { logStore.addLog('Закриття модального вікна (X)', 'info'); modalStore.closeModal(); }}>&times;</button>
        {/if}
      </div>
      <div class="modal-content">
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

        {#if details}
          {#if typeof $modalState.content === 'object' && $modalState.content !== null}
            <p class="reason">{$modalState.content.reason}</p>
          {/if}
          {#if details}
            <div class="score-detail-row">{$_('modal.scoreDetails.baseScore')} <span>{details.baseScore}</span></div>
            {#if details.sizeBonus > 0}
              <div class="score-detail-row">{$_('modal.scoreDetails.sizeBonus')} <span>+{details.sizeBonus}</span></div>
            {/if}
            {#if details.blockModeBonus > 0}
              <div class="score-detail-row">{$_('modal.scoreDetails.blockModeBonus')} <span>+{details.blockModeBonus}</span></div>
            {/if}
            {#if details.jumpBonus > 0}
              <div class="score-detail-row">{$_('modal.scoreDetails.jumpBonus')} <span>+{details.jumpBonus}</span></div>
            {/if}
          {/if}
        {/if}
      </div>
      <div class="modal-buttons">
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
              {btn.textKey ? $_(btn.textKey) : btn.text}
            </button>
          {/if}
        {/each}
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
  /* overflow-y: auto; */ /* Вимикаємо скролбар для цього контейнера */
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