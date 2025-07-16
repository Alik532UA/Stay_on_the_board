<script>
  import { modalState, modalStore } from '$lib/stores/modalStore.js';
  import { logStore } from '$lib/stores/logStore.js';
  import { _ } from 'svelte-i18n';

  const modal_data = $derived(modalState);

  // Додаю реактивну змінну для scoreDetails за допомогою руни $derived
  const details = $derived(() => (typeof $modal_data.content === 'object' && $modal_data.content !== null && $modal_data.content.scoreDetails)
    ? /** @type {any} */ ($modal_data.content.scoreDetails)
    : null);

  /**
   * @typedef {Object} ModalContent
   * @property {string} [reason]
   * @property {number} [score]
   * @property {any} [scoreDetails]
   */

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

    // @ts-ignore: кастомне поле isHot
    const idx = $modal_data.buttons.findIndex(b => b.isHot);

    if (idx !== -1 && (e.key === 'Enter' || e.key === ' ' || e.key === '5')) {
      e.preventDefault();
      e.stopPropagation(); // Додатково зупиняємо спливання події

      const button = $modal_data.buttons[idx];
      if (button && typeof button.onClick === 'function') {
        button.onClick();
      } else {
        modalStore.closeModal();
      }
    }
  }

  /**
   * @param {Event} e
   */
  function onOverlayClick(e) {
    // Якщо це "критичне" модальне вікно (2 кнопки, обидві з onClick), не закриваємо по overlay
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
  <div class="modal-overlay" role="button" tabindex="0" aria-label={$_('modal.close')} onclick={onOverlayClick} onkeydown={onModalKeydown}>
    <div class="modal-window">
      <div class="modal-header">
        {#if $modal_data.title && ($modal_data.title.includes('перемогли') || $modal_data.title.includes('Комп'))}
          <span class="modal-victory-icon">👑</span>
        {/if}
        <h2 class="modal-title">{$modal_data.title}</h2>
        {#if !(($modal_data.buttons && $modal_data.buttons.length === 2 && $modal_data.buttons.every(btn => typeof btn.onClick === 'function')))}
          <button class="modal-close" onclick={() => { logStore.addLog('Закриття модального вікна (X)', 'info'); modalStore.closeModal(); }}>&times;</button>
        {/if}
      </div>
      <!-- subtitle прибрано -->
      <div class="modal-content">
        {#if details}
          <!-- Новий деталізований вигляд -->
          {#if typeof $modal_data.content === 'object' && $modal_data.content !== null}
            <p class="reason">{$modal_data.content.reason}</p>
          {/if}
          <div class="score-breakdown">
            <div>Базовий рахунок: <span>{details().baseScore}</span></div>
            
            {#if details().sizeBonus > 0}
              <div>Бонус за розмір дошки: <span>+{details().sizeBonus}</span></div>
            {/if}
            {#if details().blockModeBonus > 0}
              <div>Бонус за режим блокування: <span>+{details().blockModeBonus}</span></div>
            {/if}
            {#if details().jumpBonus > 0}
              <div>Бонус за стрибки: <span>+{details().jumpBonus}</span></div>
            {/if}
            {#if details().noMovesBonus > 0}
              <div>Бонус "Ходів немає": <span>+{details().noMovesBonus}</span></div>
            {/if}
            
            {#if details().totalPenalty > 0}
              <div class="penalty">Штраф за зворотні ходи: <span>-{details().totalPenalty}</span></div>
            {/if}
          </div>
          <div class="final-score-container">
            <span class="score-label">Підсумковий рахунок:</span>
            <span class="score-value">{details().totalScore}</span>
          </div>
        {:else if typeof $modal_data.content === 'object' && $modal_data.content !== null && $modal_data.content.score}
          <!-- Старий вигляд з рахунком -->
          <p class="reason">{$modal_data.content.reason}</p>
          <div class="final-score-container">
            <span class="score-label">Ваш рахунок:</span>
            <span class="score-value">{$modal_data.content.score}</span>
          </div>
        {:else}
          <div class="modal-info">{$modal_data.content}</div>
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
              data-testid={`modal-btn-${i}`}
              data-role="modal-btn"
              onclick={() => { logStore.addLog(`Клік по кнопці модалки: ${btn.text}`, 'info'); (btn.onClick || modalStore.closeModal)(); }}
              aria-label={btn.text}
              aria-pressed="false"
              bind:this={hotBtn}
              tabindex="0"
            >{btn.text}</button>
          {:else}
            <button
              class="modal-btn-generic"
              class:primary={btn.primary && !btn.customClass}
              class:blue-btn={btn.customClass === 'blue-btn'}
              class:green-btn={btn.customClass === 'green-btn'}
              data-testid={`modal-btn-${i}`}
              data-role="modal-btn"
              onclick={() => { logStore.addLog(`Клік по кнопці модалки: ${btn.text}`, 'info'); (btn.onClick || modalStore.closeModal)(); }}
              aria-label={btn.text}
              aria-pressed="false"
              tabindex="-1"
            >{btn.text}</button>
          {/if}
        {/each}
        {#if !$modal_data.buttons.length}
          <button class="modal-btn-generic" data-testid="modal-btn-ok" data-role="modal-btn" onclick={() => { logStore.addLog('Закриття модального вікна (OK)', 'info'); modalStore.closeModal(); }}>{$_('modal.ok')}</button>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
.modal-overlay {
  position: fixed;
  left: 0; top: 0; right: 0; bottom: 0;
  background: rgba(30, 16, 40, 0.45);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}
.modal-victory-icon {
  font-size: 2.5em;
  margin-right: 12px;
  vertical-align: middle;
  filter: drop-shadow(0 2px 8px #ffeb3b88);
}
/* .modal-subtitle видалено */
.modal-window {
  /* Видаляємо фон, бо тепер .modal-content відповідає за glassmorphism */
  border-radius: 18px;
  min-width: 280px;
  max-width: 90vw;
  padding: 0;
  box-shadow: none;
  text-align: center;
  background: none;
}
.modal-content {
  background: rgba(40, 10, 35, 0.65);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37), 0 2px 16px 0 rgba(80,0,80,0.10);
  border-radius: 18px;
  padding: 32px 28px 18px 28px;
  max-width: 420px;
  width: 100%;
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
  padding: 24px 24px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
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
  padding: 16px 24px;
  margin: 0 auto;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
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
    padding: 20px 24px 24px;
    gap: 12px;
    width: 100%;
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

/* Стиль для основної (primary) кнопки */
.modal-btn-generic.primary {
    background: #4caf50; /* Зелений за замовчуванням для primary */
    color: #fff;
    border-color: #388e3c;
    box-shadow: 0 2px 12px 0 #4caf5040;
}

.modal-btn-generic.primary:hover {
    background: #43a047;
}

/* Спеціальний клас для синьої кнопки */
.modal-btn-generic.blue-btn {
    background: #2196f3;
    color: #fff;
    border-color: #1976d2;
    box-shadow: 0 2px 12px 0 #2196f340;
}

.modal-btn-generic.blue-btn:hover {
    background: #1976d2;
}

/* Спеціальний клас для зеленої кнопки (якщо потрібен окремо від primary) */
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
  max-width: 300px;
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
</style> 