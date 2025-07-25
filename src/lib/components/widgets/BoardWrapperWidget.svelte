<!--
ВАЖЛИВО! Архітектурний принцип: візуалізація дошки (game-board) асинхронна та незалежна від логіки гри та center-info.
- 'game-board' не впливає на 'center-info' і не змінює логіку гри.
- 'center-info' і логіка гри не знають про стан візуалізації дошки.
- Логіка гри не повинна залежати від DOM, анімацій чи рендерингу.

Це критично для коректної роботи анімацій, UX та масштабованості. Не спрощуйте і не змінюйте цю логіку під час рефакторингу!
-->
<script lang="ts">
  import { gameState } from '$lib/stores/gameState.js';
  import { settingsStore } from '$lib/stores/settingsStore.js';
  import { logStore } from '$lib/stores/logStore.js';
  import { modalStore } from '$lib/stores/modalStore.js';
  import SvgIcons from '../SvgIcons.svelte';
  import { slide, scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { isCellBlocked, getDamageClass } from '$lib/utils/boardUtils.js';
  import { animationStore } from '$lib/stores/animationStore.js';
  import { derived } from 'svelte/store';
  import { get } from 'svelte/store';
  import { onMount } from 'svelte';

  const boardSize = derived(gameState, $gameState => Number($gameState.boardSize));
  
  // Слідкуємо, чи був зроблений хід гравця (moveQueue останній елемент - player: 1)
  const shouldHideBoard = derived([
    settingsStore,
    gameState
  ], ([$settingsStore, $gameState]) => {
    if (!$settingsStore.autoHideBoard) return false;
    const lastMove = $gameState.moveQueue?.[$gameState.moveQueue.length - 1];
    return lastMove && lastMove.player === 1;
  });

  // --- Додаємо автозапуск чекбоксів перед першим ходом користувача ---
  function enableAllGameCheckboxesIfNeeded() {
    const s = get(settingsStore);
    let changed = false;
    if (!s.showBoard) { settingsStore.toggleShowBoard(true); changed = true; }
    if (!s.showQueen) { settingsStore.toggleShowQueen(); changed = true; }
    if (!s.showMoves) { settingsStore.toggleShowMoves(); changed = true; }
    // Якщо showQueen був вимкнений, showMoves міг автоматично вимкнутись, тому ще раз вмикаємо
    if (!get(settingsStore).showMoves) { settingsStore.toggleShowMoves(); }
  }

  onMount(() => {
    let lastRow = $gameState.playerRow;
    let lastCol = $gameState.playerCol;
    
    // Вмикаємо чекбокси при старті нової гри
    if ($gameState.moveHistory.length === 1) {
      enableAllGameCheckboxesIfNeeded();
    }
    
    const unsubscribe = gameState.subscribe(($gameState) => {
      if (
        get(settingsStore).autoHideBoard &&
        get(settingsStore).showBoard &&
        ($gameState.playerRow !== lastRow || $gameState.playerCol !== lastCol)
      ) {
        lastRow = $gameState.playerRow;
        lastCol = $gameState.playerCol;
        setTimeout(() => {
          if (get(settingsStore).showBoard) {
            settingsStore.toggleShowBoard(false);
          }
        }, 0);
      } else {
        lastRow = $gameState.playerRow;
        lastCol = $gameState.playerCol;
      }
      // --- Після автоприховування дошки ---
      // Вмикаємо чекбокси тільки після початку гри (є ходи в історії), а не при ініціалізації
      if ($gameState.moveQueue && $gameState.moveQueue.length === 0 && $gameState.moveHistory.length > 1) {
        enableAllGameCheckboxesIfNeeded();
      }
    });
    return unsubscribe;
  });

  function isAvailable(row: number, col: number) {
    // Повертаємо перевірку прапорця з animationStore
    // Додатково перевіряємо, що ферзь з'явився (visualRow і visualCol не null)
    const result = $settingsStore.showMoves && 
           $animationStore.showAvailableMoveDots && 
           $animationStore.visualRow !== null && 
           $animationStore.visualCol !== null &&
           get(gameState).availableMoves.some(move => move.row === row && move.col === col);
    
    // Логуємо тільки для першої клітинки, щоб не засмічувати консоль
    if (row === 0 && col === 0) {
      console.log('BoardWrapper: isAvailable(0,0) =', result, 
                  'showMoves =', $settingsStore.showMoves,
                  'showAvailableMoveDots =', $animationStore.showAvailableMoveDots,
                  'visualRow =', $animationStore.visualRow,
                  'visualCol =', $animationStore.visualCol,
                  'availableMoves.length =', get(gameState).availableMoves.length,
                  'gameId =', get(gameState).gameId);
    }
    
    return result;
  }

  function showBoardClickHint(e: Event) {
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
    modalStore.showModal({
      titleKey: 'modal.boardClickTitle',
      contentKey: 'modal.boardClickContent',
      buttons: [{ textKey: 'modal.ok', primary: true, isHot: true }]
    });
  }

  function onCellRightClick(event: MouseEvent, row: number, col: number) {
    event.preventDefault();
    if ($settingsStore.blockModeEnabled && !(row === $gameState.playerRow && col === $gameState.playerCol)) {
      const blocked = isCellBlocked(row, col, $animationStore.visualCellVisitCounts, $settingsStore);
      logStore.addLog(`${blocked ? 'Розблокування' : 'Блокування'} клітинки [${row},${col}]`, 'info');
    }
  }

  function scaleAndSlide(node: HTMLElement, params: any) {
      const slideTrans = slide(node, params);
      const scaleTrans = scale(node, params);

      return {
          duration: params.duration,
          easing: params.easing,
          css: (t: number, u: number) => `
              ${slideTrans.css ? slideTrans.css(t, u) : ''}
              ${scaleTrans.css ? scaleTrans.css(t, u) : ''}
          `
      };
  }
</script>

{#key $gameState.gameId}
  {#if $settingsStore.showBoard}
    <div 
      class="board-bg-wrapper game-content-block{ $shouldHideBoard ? ' hidden' : '' }"
      style="--board-size: {$boardSize}"
      onclick={showBoardClickHint} 
      onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && showBoardClickHint(e)}
      role="button"
      tabindex="0"
      aria-label="Ігрове поле"
      transition:scaleAndSlide={{ duration: 600, easing: quintOut }}
    >
      <div class="game-board" style="--board-size: {$boardSize}" role="grid">
        {#each Array($boardSize) as _, rowIdx (rowIdx)}
          {#each Array($boardSize) as _, colIdx (colIdx)}
            <div
              class="board-cell {getDamageClass(rowIdx, colIdx, $animationStore.visualCellVisitCounts, $settingsStore)}"
              class:light={(rowIdx + colIdx) % 2 === 0}
              class:dark={(rowIdx + colIdx) % 2 !== 0}
              class:blocked-cell={isCellBlocked(rowIdx, colIdx, $animationStore.visualCellVisitCounts, $settingsStore)}
              class:available={isAvailable(rowIdx, colIdx)}
              aria-label={`Cell ${rowIdx + 1}, ${colIdx + 1}`}
              oncontextmenu={(e) => onCellRightClick(e, rowIdx, colIdx)}
              role="gridcell"
              tabindex="0"
            >
              
              {#if isCellBlocked(rowIdx, colIdx, $animationStore.visualCellVisitCounts, $settingsStore)}
                <!-- Хрест тепер рендериться через CSS -->
              {:else}
                <span class="move-dot"></span>
              {/if}
            </div>
          {/each}
        {/each}
        
        {#if $settingsStore.showQueen && $animationStore.visualRow !== null && $animationStore.visualCol !== null}
          <div class="player-piece"
            style="top: {$animationStore.visualRow * (100 / $boardSize)}%; left: {$animationStore.visualCol * (100 / $boardSize)}%; z-index: 10;">
            <div class="piece-container">
              <SvgIcons name="queen" />
            </div>
          </div>
        {/if}
      </div>
    </div>
  {/if}
{/key}

<style>
.player-piece {
  position: absolute;
  width: calc(100% / var(--board-size, 4));
  height: calc(100% / var(--board-size, 4));
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  pointer-events: none;
  /* Ось ключова зміна: transition тепер тут постійно */
  transition: top 0.4s cubic-bezier(0.4, 0, 0.2, 1), left 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.piece-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: crown-pop 0.5s ease-out forwards;
}

@keyframes crown-pop {
  0% { transform: scale(0.5) rotate(-20deg); opacity: 0; }
  60% { transform: scale(1.2) rotate(8deg); opacity: 1; }
  100% { transform: scale(1) rotate(0); opacity: 1; }
}
</style>