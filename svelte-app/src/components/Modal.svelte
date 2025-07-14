<script>
  import { modalStore } from '../stores/modalStore.js';
  import { logStore } from '../stores/logStore.js';
  $: modal = $modalStore;

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
  <div class="modal-overlay" on:click={onOverlayClick}>
    <div class="modal-window">
      <div class="modal-title">{modal.title}</div>
      <div class="modal-content">{modal.content}</div>
      <div class="modal-buttons">
        {#each modal.buttons as btn}
          <button class={btn.primary ? 'primary' : ''} on:click={() => { logStore.addLog(`Клік по кнопці модалки: ${btn.text}`, 'info'); (btn.onClick || modalStore.closeModal)(); }}>{btn.text}</button>
        {/each}
        {#if !modal.buttons.length}
          <button on:click={() => { logStore.addLog('Закриття модального вікна (OK)', 'info'); modalStore.closeModal(); }}>OK</button>
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
  background: #fff;
  border-radius: 8px;
  min-width: 280px;
  max-width: 90vw;
  padding: 24px 20px 16px 20px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.15);
  text-align: center;
}
.modal-title {
  font-size: 1.2em;
  font-weight: bold;
  margin-bottom: 12px;
}
.modal-content {
  margin-bottom: 16px;
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
</style> 