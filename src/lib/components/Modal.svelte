<script lang="ts">
  import { modalState, modalStore } from '$lib/stores/modalStore.js';

  import { _, init } from 'svelte-i18n';
  import { i18nReady } from '$lib/i18n/init.js';
  import SvgIcons from './SvgIcons.svelte';
  import FAQModal from './FAQModal.svelte';
  import { gameState } from '$lib/stores/gameState.js';
  import { onMount } from 'svelte';
  import { audioService } from '$lib/services/audioService.js';
  import DontShowAgainCheckbox from './DontShowAgainCheckbox.svelte';
  import { focusManager } from '$lib/stores/focusManager.js';
  import { logService } from '$lib/services/logService.js';

  let hotBtn: HTMLButtonElement | null = null;
  let modalContent: HTMLDivElement | null = null;

  let expertVolume = 0.3;
  let volumePercentage = 30;
  let isCompactScoreMode = false;

  onMount(() => {
    expertVolume = audioService.loadVolume();
    
    // Додаємо обробник resize для перевірки компактного режиму
    const handleResize = () => {
      if ($modalState.isOpen) {
        checkCompactMode();
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      audioService.pause();
      window.removeEventListener('resize', handleResize);
    };
  });

  // Реактивний блок для керування логікою
  $: {
    const isTestEnvironment = import.meta.env.CI === 'true' || import.meta.env.MODE === 'test';
    const shouldPlay = $modalState.isOpen && $modalState.titleKey === 'modal.expertModeTitle' && !isTestEnvironment;

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
    focusManager.focusWithDelay(hotBtn, 50);
  }

  // Функція для перевірки, чи потрібен компактний режим
  function checkCompactMode() {
    if (modalContent) {
      const hasScroll = modalContent.scrollHeight > modalContent.clientHeight;
      isCompactScoreMode = hasScroll;
    }
  }

  // Перевіряємо компактний режим при зміні стану модального вікна
  $: if ($modalState.isOpen && modalContent) {
    // Невелика затримка для забезпечення рендерингу
    setTimeout(checkCompactMode, 100);
  }

  function onModalKeydown(e: KeyboardEvent) {
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

  function onOverlayClick(e: MouseEvent) {
    if (!$modalState.closable) return;
    const target = e.target as HTMLElement;
    if (target && target.classList.contains('modal-overlay')) {
      logService.ui('Закриття модального вікна (overlay)');
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
          <h2 class="modal-title">
            {#if $i18nReady && $modalState.titleKey}
              {@html $_($modalState.titleKey, {
                values: $modalState.content as any
              })}
            {:else}
              {$modalState.title}
            {/if}
          </h2>
        </div>

        {#if !(($modalState.buttons && $modalState.buttons.length === 2 && $modalState.buttons.every(btn => typeof btn.onClick === 'function')) || $modalState.titleKey === 'modal.gameOverTitle' || ($modalState.buttons && $modalState.buttons.length === 1))}
          {#if $modalState.closable}
            <button class="modal-close" onclick={() => { logService.ui('Закриття модального вікна (X)'); modalStore.closeModal(); }}>×</button>
          {/if}
        {/if}
      </div>
      <div class="modal-content" class:is-faq={typeof $modalState.content === 'object' && $modalState.content && 'isFaq' in $modalState.content && $modalState.content.isFaq} bind:this={modalContent}>
        {#if typeof $modalState.content === 'object' && $modalState.content && 'reason' in $modalState.content}
          <p class="reason">{$modalState.content.reason}</p>
        {/if}
        {#if $modalState.component}
          <svelte:component this={$modalState.component as any} />
        {:else if typeof $modalState.content === 'object' && $modalState.content && 'isFaq' in $modalState.content && $modalState.content.isFaq}
          <FAQModal />
        {:else if typeof $modalState.content === 'object' && $modalState.content && 'key' in $modalState.content && 'actions' in $modalState.content}
          <p class="reason">{$_('modal.keyConflictContent', { values: { key: $modalState.content.key as string } })}</p>
        {:else if $modalState.contentKey}
          <p class="reason">
            {@html $_($modalState.contentKey, {
              values: $modalState.content as any
            })}
          </p>
        {:else if typeof $modalState.content === 'string' && $modalState.content}
          <p class="reason">
            {@html $modalState.content}
          </p>
        {/if}

                 {#if $gameState.isGameOver || ($modalState.content && typeof $modalState.content === 'object' && 'scoreDetails' in $modalState.content)}
           <!-- Показуємо рахунки гравців для локальної гри -->
           {#if ($modalState.content as any)?.playerScores && ($modalState.content as any).playerScores.length > 0}
             <div class="player-scores-container">
               <h3>Рахунки гравців:</h3>
               {#each ($modalState.content as any).playerScores as playerScore}
                 <div class="player-score-row" class:winner={playerScore.isWinner} class:loser={playerScore.isLoser}>
                   <span class="player-name">
                     {#if playerScore.isWinner}
                       <span class="winner-badge">🏆</span>
                     {:else if playerScore.isLoser}
                       <span class="loser-badge">🐚</span>
                     {/if}
                     {$_('modal.scoreDetails.playerScore', {
                       values: {
                         playerName: playerScore.playerName,
                         score: playerScore.score
                       }
                     })}
                   </span>
                 </div>
               {/each}
             </div>
           {:else}
             <!-- Показуємо деталі рахунку тільки для гри проти комп'ютера -->
             <div class="score-details-container">
               <div class="score-detail-row">{$_('modal.scoreDetails.baseScore')} <span>{($modalState.content as any)?.scoreDetails?.baseScore ?? ($modalState.content as any)?.scoreDetails?.score ?? 0}</span></div>
               {#if (($modalState.content as any)?.scoreDetails?.sizeBonus ?? $gameState.sizeBonus ?? 0) > 0}
                 <div class="score-detail-row">{$_('modal.scoreDetails.sizeBonus')} <span>+{($modalState.content as any)?.scoreDetails?.sizeBonus ?? $gameState.sizeBonus ?? 0}</span></div>
               {/if}
               {#if (($modalState.content as any)?.scoreDetails?.blockModeBonus ?? $gameState.blockModeBonus ?? 0) > 0}
                 <div class="score-detail-row">{$_('modal.scoreDetails.blockModeBonus')} <span>+{($modalState.content as any)?.scoreDetails?.blockModeBonus ?? $gameState.blockModeBonus ?? 0}</span></div>
               {/if}
               {#if (($modalState.content as any)?.scoreDetails?.jumpBonus ?? $gameState.jumpBonus ?? 0) > 0}
                 <div class="score-detail-row">{$_('modal.scoreDetails.jumpBonus')} <span>+{($modalState.content as any)?.scoreDetails?.jumpBonus ?? $gameState.jumpBonus ?? 0}</span></div>
               {/if}
               {#if (($modalState.content as any)?.scoreDetails?.noMovesBonus ?? $gameState.noMovesBonus ?? 0) > 0}
                 <div class="score-detail-row">{$_('modal.scoreDetails.noMovesBonus')} <span>+{($modalState.content as any)?.scoreDetails?.noMovesBonus ?? $gameState.noMovesBonus ?? 0}</span></div>
               {/if}
               {#if (($modalState.content as any)?.scoreDetails?.distanceBonus ?? $gameState.distanceBonus ?? 0) > 0}
                 <div class="score-detail-row">{$_('modal.scoreDetails.distanceBonus')} <span>+{($modalState.content as any)?.scoreDetails?.distanceBonus ?? $gameState.distanceBonus ?? 0}</span></div>
               {/if}
               {#if ($modalState.titleKey === 'modal.gameOverTitle' && (($modalState.content as any)?.scoreDetails?.finishBonus ?? $gameState.finishBonus ?? 0) > 0)}
                 <div class="score-detail-row">{$_('modal.scoreDetails.finishBonus')} <span>+{($modalState.content as any)?.scoreDetails?.finishBonus ?? $gameState.finishBonus ?? 0}</span></div>
               {/if}
               {#if (($modalState.content as any)?.scoreDetails?.totalPenalty ?? $gameState.totalPenalty ?? 0) > 0}
                 <div class="score-detail-row penalty">{$_('modal.scoreDetails.penalty')} <span>-{($modalState.content as any)?.scoreDetails?.totalPenalty ?? $gameState.totalPenalty ?? 0}</span></div>
               {/if}
             </div>
             <div class="final-score-container" class:compact={isCompactScoreMode}>
               {#if isCompactScoreMode}
                 <div class="final-score-compact">
                   <span class="final-score-label-inline">{$_('modal.scoreDetails.finalScore')}</span>
                   <span class="final-score-value-inline">{($modalState.content as any)?.scoreDetails?.totalScore ?? ($modalState.content as any)?.scoreDetails?.score ?? 0}</span>
                 </div>
               {:else}
                 <div class="final-score-label">{$_('modal.scoreDetails.finalScore')}</div>
                 <div class="final-score-value">{($modalState.content as any)?.scoreDetails?.totalScore ?? ($modalState.content as any)?.scoreDetails?.score ?? 0}</div>
               {/if}
             </div>
           {/if}
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
              onclick={() => { 
                logService.action(`Click: "${btn.textKey ? $_(btn.textKey) : btn.text}" (Modal)`);
                logService.ui(`Клік по кнопці модалки: ${btn.textKey ? $_(btn.textKey) : btn.text}`);
                logService.ui('Modal button clicked (hot):', { textKey: btn.textKey, text: btn.text, onClick: btn.onClick });
                if (btn.onClick) {
                  logService.ui('Executing onClick handler...');
                  btn.onClick();
                } else {
                  logService.ui('No onClick handler, closing modal');
                  modalStore.closeModal();
                }
              }}
              aria-label={btn.textKey ? $_(btn.textKey) : btn.text}
            >
              {$i18nReady && btn.textKey ? $_(btn.textKey) : btn.text}
            </button>
          {:else}
            <button
              class="modal-btn-generic"
              class:primary={btn.primary && !btn.customClass}
              class:blue-btn={btn.customClass === 'blue-btn'}
              class:green-btn={btn.customClass === 'green-btn'}
              class:danger-btn={btn.customClass === 'danger-btn'}
              onclick={() => { 
                logService.action(`Click: "${btn.textKey ? $_(btn.textKey) : btn.text}" (Modal)`);
                logService.ui(`Клік по кнопці модалки: ${btn.textKey ? $_(btn.textKey) : btn.text}`);
                logService.ui('Modal button clicked (regular):', { textKey: btn.textKey, text: btn.text, onClick: btn.onClick });
                if (btn.onClick) {
                  logService.ui('Executing onClick handler...');
                  btn.onClick();
                } else {
                  logService.ui('No onClick handler, closing modal');
                  modalStore.closeModal();
                }
              }}
              aria-label={btn.textKey ? $_(btn.textKey) : btn.text}
            >
              {$i18nReady && btn.textKey ? $_(btn.textKey) : btn.text}
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
  max-height: 85vh;
  min-height: 200px;
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
  border: 2px solid rgba(255, 255, 255, 0.2) !important;
  overflow-y: auto;
  max-height: 60vh;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
}

.modal-content.is-faq {
  text-align: left;
  padding-right: 10px;
}

.modal-content.is-faq::-webkit-scrollbar {
  width: 8px;
}

.modal-content.is-faq::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.modal-content.is-faq::-webkit-scrollbar-thumb {
  background-color: var(--text-accent, #ff9800);
  border-radius: 4px;
  border: 2px solid transparent;
  background-clip: content-box;
}

.modal-content.is-faq::-webkit-scrollbar-thumb:hover {
  background-color: #fff;
}

.modal-content::-webkit-scrollbar {
  width: 6px;
}

.modal-content::-webkit-scrollbar-track {
  background: transparent;
}

.modal-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.modal-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}
.modal-header {
  padding: 20px 24px;
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

/* Компактний режим для фінального рахунку */
.final-score-container.compact {
  padding: 12px;
}

.final-score-compact {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.final-score-label-inline {
  font-size: 1em;
  color: var(--text-secondary);
  font-weight: 500;
}

.final-score-value-inline {
  font-size: 2.2em;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
}

/* Адаптивні стилі для компактного відображення */
@media (max-width: 480px) {
  .modal-window {
    max-height: 80vh;
    margin: 8px;
  }
  
  .modal-header {
    padding: 20px 16px 12px;
  }
  .modal-title {
    font-size: 1.6em;
  }
  .modal-content {
    padding: 16px;
    max-height: 50vh;
  }
  
  /* Компактний режим для фінального рахунку */
  .final-score-container {
    padding: 12px;
  }
  
  .final-score-container.compact {
    padding: 10px;
  }
  
  .final-score-label {
    font-size: 0.9em;
    margin-bottom: 4px;
  }
  
  .final-score-value {
    font-size: 2.2em;
  }
  
  .final-score-label-inline {
    font-size: 0.9em;
  }
  
  .final-score-value-inline {
    font-size: 1.8em;
  }
  
  /* Компактний режим для деталей рахунку */
  .score-details-container {
    padding: 10px 12px;
    margin-bottom: 16px;
  }
  
  .score-detail-row {
    padding: 6px 0;
    font-size: 0.9em;
  }
  
  .reason {
    font-size: 1em;
    margin-bottom: 20px;
  }
  
  /* Стилі для рахунків гравців */
  .player-scores-container {
    margin-bottom: 20px;
    padding: 15px;
    background: var(--bg-secondary);
    border-radius: var(--unified-border-radius);
    border: var(--unified-border);
  }
  
  .player-scores-container h3 {
    margin: 0 0 10px 0;
    font-size: 1.1em;
    color: var(--text-primary);
  }
  
  .player-score-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid var(--border-color);
  }
  
  .player-score-row:last-child {
    border-bottom: none;
  }
  
  .player-score-row.winner {
    font-weight: bold;
    color: var(--accent-color);
  }
  
  .player-name {
    flex: 1;
    display: flex;
    align-items: center;
  }

  .winner-badge, .loser-badge {
    margin-right: 10px;
    font-size: 1.2em;
  }

  .player-score-row.loser {
    color: var(--text-secondary);
  }
}

/* Дуже компактний режим для дуже маленьких екранів */
@media (max-width: 360px) {
  .modal-window {
    max-height: 75vh;
    margin: 4px;
  }
  
  .modal-content {
    max-height: 45vh;
    padding: 12px;
  }
  
  .final-score-container {
    padding: 8px;
  }
  
  .final-score-container.compact {
    padding: 6px;
  }
  
  .final-score-label {
    font-size: 0.8em;
    margin-bottom: 2px;
  }
  
  .final-score-value {
    font-size: 1.8em;
  }
  
  .final-score-label-inline {
    font-size: 0.8em;
  }
  
  .final-score-value-inline {
    font-size: 1.5em;
  }
  
  .score-details-container {
    padding: 8px 10px;
    margin-bottom: 12px;
  }
  
  .score-detail-row {
    padding: 4px 0;
    font-size: 0.85em;
  }
  
  .reason {
    font-size: 0.9em;
    margin-bottom: 16px;
  }
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
  background: transparent;
}


</style>