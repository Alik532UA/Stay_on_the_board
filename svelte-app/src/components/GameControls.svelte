<script>
  import { appState, toggleBlockMode, resetGame } from '../stores/gameStore.js';
  import { modalStore } from '../stores/modalStore.js';
  import { logStore } from '../stores/logStore.js';
  $: blockModeEnabled = $appState.blockModeEnabled;

  /**
   * @typedef {Object} ModalButton
   * @property {string} text
   * @property {boolean} [primary]
   * @property {() => void} [onClick]
   */

  function confirmReset() {
    logStore.addLog('Запит на скидання гри', 'info');
    /** @type {ModalButton[]} */
    const buttons = [
      { text: 'OK', primary: true, onClick: () => { logStore.addLog('Гру скинуто', 'info'); resetGame(); modalStore.closeModal(); } },
      { text: 'Скасувати', onClick: modalStore.closeModal }
    ];
    modalStore.showModal({
      title: 'Скинути гру?',
      content: 'Ви впевнені, що хочете скинути гру? Всі блокування та позиція гравця будуть втрачені.',
      buttons
    });
  }

  function onBlockModeChange() {
    logStore.addLog(`Режим блокування клітинок: ${!blockModeEnabled ? 'увімкнено' : 'вимкнено'}`, 'info');
    toggleBlockMode();
  }
</script>

<div class="game-controls">
  <label>
    <input type="checkbox" bind:checked={blockModeEnabled} on:change={onBlockModeChange} />
    Режим блокування клітинок
  </label>
  <button on:click={confirmReset} style="margin-left: 24px;">Скинути гру</button>
</div>

<style>
.game-controls {
  margin: 16px 0;
  padding: 8px 0;
  border-top: 1px solid #ccc;
  border-bottom: 1px solid #ccc;
  text-align: center;
}
.game-controls button {
  margin-left: 16px;
  padding: 4px 12px;
  font-size: 1em;
  cursor: pointer;
}
</style> 