<script>
  import { modalStore } from '$lib/stores/modalStore.js';
  import { logStore } from '$lib/stores/logStore.js';
  import { _ } from 'svelte-i18n';
  $: modal = $modalStore;
  // Додаю реактивну змінну для scoreDetails
  $: details = (typeof modal.content === 'object' && modal.content !== null && modal.content.scoreDetails)
    ? /** @type {any} */ (modal.content.scoreDetails)
    : null;

  /**
   * @param {Event} e
   */
  function onOverlayClick(e) {
    const target = /** @type {HTMLElement|null} */(e.target);
    if (target && target.classList.contains('modal-overlay')) {
      logStore.addLog('Закриття модального вікна (overlay)', 'info');
      modalStore.closeModal();
    }
  }
</script>

{#if modal.isOpen}
  <div class="modal-overlay" role="button" tabindex="0" aria-label={$_('modal.close')} on:click={onOverlayClick} on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && onOverlayClick(e)}>
    <div class="modal-window">
      <div class="modal-header">
        <h2 class="modal-title">{modal.title}</h2>
        <button class="modal-close" on:click={() => { logStore.addLog('Закриття модального вікна (X)', 'info'); modalStore.closeModal(); }}>&times;</button>
      </div>
      <div class="modal-content">
        {#if details}
          <!-- Новий деталізований вигляд -->
          {#if typeof modal.content === 'object' && modal.content !== null}
            <p class="reason">{modal.content.reason}</p>
          {/if}
          <div class="score-breakdown">
            <div>Базовий рахунок: <span>{details.baseScore}</span></div>
            
            {#if details.sizeBonus > 0}
              <div>Бонус за розмір дошки: <span>+{details.sizeBonus}</span></div>
            {/if}
            {#if details.blockModeBonus > 0}
              <div>Бонус за режим блокування: <span>+{details.blockModeBonus}</span></div>
            {/if}
            {#if details.jumpBonus > 0}
              <div>Бонус за стрибки: <span>+{details.jumpBonus}</span></div>
            {/if}
            {#if details.noMovesBonus > 0}
              <div>Бонус "Ходів немає": <span>+{details.noMovesBonus}</span></div>
            {/if}
            
            {#if details.totalPenalty > 0}
              <div class="penalty">Штраф за зворотні ходи: <span>-{details.totalPenalty}</span></div>
            {/if}
          </div>
          <div class="final-score-container">
            <span class="score-label">Підсумковий рахунок:</span>
            <span class="score-value">{details.totalScore}</span>
          </div>
        {:else if typeof modal.content === 'object' && modal.content !== null && modal.content.score}
          <!-- Старий вигляд з рахунком -->
          <p class="reason">{modal.content.reason}</p>
          <div class="final-score-container">
            <span class="score-label">Ваш рахунок:</span>
            <span class="score-value">{modal.content.score}</span>
          </div>
        {:else}
          {modal.content}
        {/if}
      </div>
      <div class="modal-buttons">
        {#each modal.buttons as btn}
          <button class={btn.primary ? 'primary' : ''} on:click={() => { logStore.addLog(`Клік по кнопці модалки: ${btn.text}`, 'info'); (btn.onClick || modalStore.closeModal)(); }}>{btn.text}</button>
        {/each}
        {#if !modal.buttons.length}
          <button on:click={() => { logStore.addLog('Закриття модального вікна (OK)', 'info'); modalStore.closeModal(); }}>{$_('modal.ok')}</button>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
.modal-overlay {
  position: fixed;
  left: 0; top: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.3);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}
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
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
  border-radius: 18px;
  padding: 0;
  max-width: 90vw;
  max-height: 90vh;
  width: 420px;
  overflow: hidden;
  position: relative;
  color: var(--text-primary, #fff);
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
.modal-header {
  background: transparent;
  padding: 24px 24px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.modal-title {
  margin: 0;
  font-size: 1.6em;
  font-weight: 700;
  color: var(--text-primary, #fff);
  text-align: center;
  flex: 1;
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
  padding-top: 20px;
  padding-bottom: 24px;
}
.modal-buttons button {
  margin: 0 8px;
  padding: 6px 18px;
  font-size: 1em;
  border-radius: 6px;
  border: none;
  background: #eee;
  cursor: pointer;
}
.modal-buttons button.primary {
  background: #4caf50;
  color: #fff;
}
.reason {
  font-size: 1.1em;
  color: var(--text-secondary, #ccc);
  margin-bottom: 20px;
  margin-top: 32px;
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
</style> 