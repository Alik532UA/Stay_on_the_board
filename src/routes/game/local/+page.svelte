<script lang="ts">
  // НАВІЩО: Ця сторінка буде відповідати за відображення локальної гри.
  // Зараз вона використовує ті ж віджети, що й гра проти AI, але в майбутньому
  // її вміст може бути змінено (наприклад, інша панель керування).

  import '$lib/css/components/game-board.css';
  import '$lib/css/components/controls.css';
  import DraggableColumns from '$lib/components/DraggableColumns.svelte';
  import { layoutStore, WIDGETS } from '$lib/stores/layoutStore.js';
  import TopRowWidget from '$lib/components/widgets/TopRowWidget.svelte';
  import ScorePanelWidget from '$lib/components/widgets/ScorePanelWidget.svelte';
  import BoardWrapperWidget from '$lib/components/widgets/BoardWrapperWidget.svelte';
  import ControlsPanelWidget from '$lib/components/widgets/ControlsPanelWidget.svelte';
  import SettingsExpanderWidget from '$lib/components/widgets/SettingsExpanderWidget.svelte';
  import GameInfoWidget from '$lib/components/widgets/GameInfoWidget.svelte';
  import DevClearCacheButton from '$lib/components/widgets/DevClearCacheButton.svelte';
  import { settingsStore } from '$lib/stores/settingsStore.js';
  import { onMount } from 'svelte';
  import { afterNavigate } from '$app/navigation';
  import { animationStore } from '$lib/stores/animationStore.js';
  import { gameOverStore } from '$lib/stores/gameOverStore';
  import { modalStore } from '$lib/stores/modalStore.js';
  import { gameOrchestrator } from '$lib/gameOrchestrator';
  import { get } from 'svelte/store';
  import { _ } from 'svelte-i18n';
  import { gameState } from '$lib/stores/gameState.js';
  import { localGameStore } from '$lib/stores/localGameStore.js';
  
  // Примітка: onMount та ініціалізація гри тут не потрібні,
  // оскільки вони відбуваються на сторінці /local-setup

  /**
   * Показує модальне вікно завершення гри, якщо це необхідно.
   */
  function showGameOverModalIfNeeded() {
    const gameOverState = get(gameOverStore);
    const localGameState = get(localGameStore); // Отримуємо стан локальної гри
    const $t = get(_);

    if (gameOverState.isGameOver && gameOverState.gameResult && gameOverState.gameResult.gameType === 'local') {
      const { gameResult } = gameOverState;
      
      // Визначаємо переможця на основі даних з localGameStore
      const losingPlayerIndex = get(gameState).currentPlayerIndex;
      let winners: number[] = [];
      let maxScore = -1;

      for (let i = 0; i < localGameState.players.length; i++) {
        if (i !== losingPlayerIndex) {
          const playerScore = localGameState.players[i].score;
          if (playerScore > maxScore) {
            maxScore = playerScore;
            winners = [i];
          } else if (playerScore === maxScore) {
            winners.push(i);
          }
        }
      }
      
      if (winners.length === 0) { // Якщо всі програли
          for (let i = 0; i < localGameState.players.length; i++) {
              const playerScore = localGameState.players[i].score;
              if (playerScore > maxScore) {
                  maxScore = playerScore;
                  winners = [i];
              } else if (playerScore === maxScore) {
                  winners.push(i);
              }
          }
      }

      const playerScores = localGameState.players.map((player, index) => ({
        playerNumber: index + 1,
        name: player.name,
        score: player.score,
        isWinner: winners.includes(index)
      }));

      let titleKey = 'modal.gameOverTitle';
      let winnerName = '';
      let winnerNames = '';
      if (winners.length === 1) {
        titleKey = 'modal.winnerTitle';
        winnerName = localGameState.players[winners[0]].name;
      } else if (winners.length > 1) {
        titleKey = 'modal.winnersTitle';
        winnerNames = winners.map(i => localGameState.players[i].name).join(', ');
      }

      const modalContent = {
        reason: $t(gameResult.reasonKey || '', { values: { playerName: localGameState.players[losingPlayerIndex].name } }),
        playerScores: playerScores,
        winnerName: winnerName,
        winnerNumbers: winnerNames, // Додаємо імена переможців
        scoreDetails: gameResult.finalScoreDetails
      };

      modalStore.showModal({
        titleKey: titleKey,
        content: modalContent,
        buttons: [
          { textKey: 'modal.playAgain', primary: true, onClick: gameOrchestrator.restartLocalGame, isHot: true },
          { textKey: 'modal.watchReplay', customClass: 'blue-btn', onClick: gameOrchestrator.startReplay }
        ]
      });
    }
  }

  onMount(() => {
    // Залишаємо тільки первинну ініціалізацію
    settingsStore.init();
    animationStore.initialize();
  });

  afterNavigate(() => {
    // Цей код буде виконуватися КОЖНОГО РАЗУ при переході на сторінку
    const savedGameOverState = sessionStorage.getItem('replayGameOverState');
    if (savedGameOverState) {
      try {
        const parsedGameOverState = JSON.parse(savedGameOverState);
        // @ts-ignore
        gameOverStore.restoreState(parsedGameOverState);
        sessionStorage.removeItem('replayGameOverState');

        const savedGameState = sessionStorage.getItem('replayGameState');
        if (savedGameState) {
          gameState.set(JSON.parse(savedGameState));
          sessionStorage.removeItem('replayGameState');
        }

        const savedLocalGameState = sessionStorage.getItem('replayLocalGameState');
        if (savedLocalGameState) {
          localGameStore.restoreState(JSON.parse(savedLocalGameState));
          sessionStorage.removeItem('replayLocalGameState');
        }
        
        showGameOverModalIfNeeded();

      } catch (e) {
        console.error('Не вдалося відновити стан гри з sessionStorage', e);
      }
    } else {
      showGameOverModalIfNeeded();
    }
  });

  const widgetMap = {
    [WIDGETS.TOP_ROW]: TopRowWidget,
    [WIDGETS.SCORE_PANEL]: ScorePanelWidget,
    [WIDGETS.BOARD_WRAPPER]: BoardWrapperWidget,
    [WIDGETS.CONTROLS_PANEL]: ControlsPanelWidget,
    [WIDGETS.SETTINGS_EXPANDER]: SettingsExpanderWidget,
    [WIDGETS.GAME_INFO]: GameInfoWidget,
  };

  $: columns = $layoutStore.map(col => ({
    id: col.id,
    label: col.id,
    items: col.widgets.map(id => ({ id, label: id }))
  }));

  function itemContent(item: {id: string, label: string}) {
    const Comp = widgetMap[item.id];
    if (Comp) return Comp;
    return item.id;
  }

  function handleDrop(e: CustomEvent<{dragging: {id: string, label: string}, dragSourceCol: string, dropTargetCol: string, dropIndex: number}>) {
    const { dragging, dragSourceCol, dropTargetCol, dropIndex } = e.detail;
    layoutStore.update(cols => {
      let newCols = cols.map(col => ({
        ...col,
        widgets: col.widgets.filter(id => id !== dragging.id)
      }));
      return newCols.map(col => {
        if (col.id === dropTargetCol) {
          const widgets = [...col.widgets];
          widgets.splice(dropIndex, 0, dragging.id);
          return { ...col, widgets };
        }
        return col;
      });
    });
  }
</script>

<DraggableColumns {columns} itemContent={itemContent} on:drop={handleDrop} />
<DevClearCacheButton /> 