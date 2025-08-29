Звісно. Цей крок є логічним продовженням централізації логіки в оркестраторі. Ми зробимо `gameActions.ts` максимально "чистим" файлом, що відповідає лише за мутацію стану `gameState`. Це значно покращить тестування, передбачуваність та дотримання принципу SoC (Separation of Concerns).

---

### Детальний План: Розділення `gameActions.ts`

**Мета:** Перетворити `gameActions.ts` на набір чистих функцій-мутаторів, які працюють виключно зі станом `gameState`. Всю складну логіку, що залежить від інших сторів (`appSettingsStore`, `playerInputStore`) або має побічні ефекти (навігація, виклик модальних вікон), буде перенесено до `gameOrchestrator.js`.

---

#### Крок 1: Аналіз та перенесення логіки з `gameActions.ts`

Спочатку ми ідентифікуємо та перенесемо "нечистий" код з `gameActions.ts` до `gameOrchestrator.js`.

1.  **Відкрийте файл:** `src/lib/stores/gameActions.ts`
2.  **Проаналізуйте функцію `setBoardSize`:**
    *   **Проблема:** Ця функція залежить від `gameState` (для перевірки рахунку) і викликає побічний ефект (`modalStore.showModal`).
    *   **Дія:** Ми перенесемо цю логіку в `gameOrchestrator.js`.

3.  **Проаналізуйте функцію `processPlayerMove`:**
    *   **Проблема:** Ця функція залежить від `appSettingsStore`, `lastComputerMove` (похідний від `gameState`), та `playerInputStore`. Вона виконує складні розрахунки, які є частиною ігрового циклу, а не простою мутацією.
    *   **Дія:** Ми перенесемо її логіку в `gameOrchestrator.js`.

4.  **Проаналізуйте функцію `endGame`:**
    *   **Проблема:** Вона залежить від `core.calculateFinalScore`, який, у свою чергу, залежить від багатьох полів стану. Це логіка завершення гри, яка належить оркестратору.
    *   **Дія:** Перенесемо її в `gameOrchestrator.js`.

5.  **Проаналізуйте функцію `startReplay`:**
    *   **Проблема:** Вона виконує побічні ефекти: робота з `sessionStorage` та навігація (`goto`).
    *   **Дія:** Перенесемо її в `gameOrchestrator.js`.

---

#### Крок 2: Рефакторинг `gameOrchestrator.js`

Тепер ми додамо перенесену логіку в наш сервіс.

1.  **Відкрийте файл:** `src/lib/gameOrchestrator.js`
2.  **Додайте нові методи до об'єкта `gameOrchestrator`:**

    ```javascript
    // src/lib/gameOrchestrator.js
    // ... (існуючі імпорти)

    export const gameOrchestrator = {
      // ... (існуючі методи confirmPlayerMove, claimNoMoves, _triggerComputerMove, _handleComputerMoveSideEffects)

      /**
       * Встановлює новий розмір дошки, обробляючи логіку підтвердження.
       * @param {number} newSize
       */
      setBoardSize(newSize) {
        const { score, penaltyPoints, boardSize } = get(gameState);
        if (newSize === boardSize) return;

        if (score === 0 && penaltyPoints === 0) {
          gameActions.resetGame({ newSize });
        } else {
          modalStore.showModal({
            titleKey: 'modal.resetScoreTitle',
            contentKey: 'modal.resetScoreContent',
            buttons: [
              { 
                textKey: 'modal.resetScoreConfirm', 
                customClass: 'green-btn', 
                isHot: true, 
                onClick: () => { 
                  gameActions.resetGame({ newSize }); 
                  modalStore.closeModal(); 
                } 
              },
              { textKey: 'modal.resetScoreCancel', onClick: modalStore.closeModal }
            ]
          });
        }
      },

      /**
       * Завершує гру з вказаною причиною.
       * @param {string} reasonKey
       * @param {Record<string, any> | null} [reasonValues=null]
       */
      endGame(reasonKey, reasonValues = null) {
        const state = get(gameState);
        const finalScoreDetails = core.calculateFinalScore(state);
        gameState.update(s => ({ 
          ...s, 
          isGameOver: true, 
          baseScore: finalScoreDetails.baseScore,
          sizeBonus: finalScoreDetails.sizeBonus,
          blockModeBonus: finalScoreDetails.blockModeBonus,
          jumpBonus: finalScoreDetails.jumpBonus,
          finishBonus: finalScoreDetails.finishBonus,
          noMovesBonus: finalScoreDetails.noMovesBonus,
          totalPenalty: finalScoreDetails.totalPenalty,
          totalScore: finalScoreDetails.totalScore,
          gameOverReasonKey: reasonKey,
          gameOverReasonValues: reasonValues
        }));
      },

      /**
       * Запускає режим перегляду повтору.
       */
      startReplay() {
        modalService.closeModal();
        const { moveHistory, boardSize } = get(gameState);
        sessionStorage.setItem('replayData', JSON.stringify({ moveHistory, boardSize }));
        replayStore.update(state => ({ ...state, isReplayMode: true, replayCurrentStep: 0 }));
        goto(`${base}/replay`);
      },
      
      // ... (інші методи, які можуть знадобитися, наприклад, finalizeGameWithBonus, continueAfterNoMoves)
    };
    ```

3.  **Оновіть метод `confirmPlayerMove` всередині `gameOrchestrator.js`:**
    *   Замініть виклики `gameActions.processPlayerMove` та `gameActions.endGame` на виклики внутрішніх методів або перенесіть логіку напряму.

    **Було (в `confirmPlayerMove`):**
    ```javascript
    // ...
    if (isOutsideBoard || isCellBlocked) {
      gameActions.performMove(newRow, newCol);
      gameActions.endGame(isOutsideBoard ? 'modal.gameOverReasonOut' : 'modal.gameOverReasonBlocked');
      // ...
      return;
    }
    gameActions.processPlayerMove(playerRow, playerCol, newRow, newCol);
    gameActions.performMove(newRow, newCol);
    // ...
    ```

    **Стане (в `confirmPlayerMove`):**
    ```javascript
    // ...
    if (isOutsideBoard || isCellBlocked) {
      gameActions.performMove(newRow, newCol); // Це чиста мутація, залишаємо
      this.endGame(isOutsideBoard ? 'modal.gameOverReasonOut' : 'modal.gameOverReasonBlocked'); // Викликаємо метод оркестратора
      // ...
      return;
    }
    this._processPlayerMove(playerRow, playerCol, newRow, newCol); // Викликаємо новий приватний метод
    gameActions.performMove(newRow, newCol); // Це чиста мутація, залишаємо
    // ...
    ```

4.  **Створіть новий приватний метод `_processPlayerMove` в `gameOrchestrator.js`**, перенісши в нього логіку з `gameActions.ts`:

    ```javascript
    // Всередині об'єкта gameOrchestrator
    _processPlayerMove(startRow, startCol, newRow, newCol) {
      const settings = get(appSettingsStore);
      const computerMove = get(lastComputerMove);
      const { selectedDistance, selectedDirection } = get(playerInputStore);
      const { cellVisitCounts } = get(gameState);

      let scoreChange = 1;
      if (!settings.showBoard) scoreChange = 3;
      else if (!settings.showQueen) scoreChange = 2;

      let penaltyChange = 0;
      if (
        !settings.blockModeEnabled &&
        computerMove &&
        selectedDirection === core.oppositeDirections[computerMove.direction] &&
        selectedDistance != null &&
        selectedDistance <= computerMove.distance
      ) {
        penaltyChange = 2;
      }

      const blockModeMovesChange = settings.blockModeEnabled ? 1 : 0;
      const jumpedCellsChange = settings.blockModeEnabled 
        ? core.countJumpedCells(startRow, startCol, newRow, newCol, cellVisitCounts, settings.blockOnVisitCount)
        : 0;

      gameState.update(s => ({
        ...s, 
        score: s.score + scoreChange,
        penaltyPoints: s.penaltyPoints + penaltyChange,
        movesInBlockMode: s.movesInBlockMode + blockModeMovesChange,
        jumpedBlockedCells: s.jumpedBlockedCells + jumpedCellsChange,
      }));
    },
    ```

---

#### Крок 3: Очищення `gameActions.ts`

Тепер, коли вся складна логіка перенесена, ми можемо залишити в `gameActions.ts` тільки чисті функції-мутатори.

1.  **Відкрийте файл:** `src/lib/stores/gameActions.ts`
2.  **Видаліть** з нього функції: `setBoardSize`, `processPlayerMove`, `endGame`, `startReplay`, `finalizeGameWithBonus`, `continueAfterNoMoves`, `stopReplay`, `goToReplayStep`, `toggleAutoPlayForward`.
3.  **Залиште тільки:** `resetGame`, `performMove`, `updateAvailableMoves`, `setDirection`, `setDistance`.

**Результат:** `gameActions.ts` стане дуже простим і буде містити лише функції, які безпосередньо змінюють стан `gameState` або `playerInputStore` на основі переданих аргументів, без жодних залежностей від інших сторів.

---

#### Крок 4: Оновлення викликів у компонентах

Нарешті, оновіть компоненти, щоб вони викликали методи оркестратора замість старих експортів з `gameActions`.

1.  **`SettingsExpanderWidget.svelte`:**
    *   Замість `setBoardSize(newSize)` викликайте `gameOrchestrator.setBoardSize(newSize)`.

2.  **`Modal.svelte` (та інші місця, де викликається `endGame`, `resetGame`, `startReplay`):**
    *   Переконайтеся, що всі виклики йдуть або до `gameActions` (для `resetGame`), або до `gameOrchestrator` (для `endGame`, `startReplay` тощо).

### Результат та Перевірка

-   **Чітке розділення:** `gameActions.ts` тепер є бібліотекою чистих мутаторів. `gameOrchestrator.js` — це "мозок" гри, який керує потоком.
-   **Легке тестування:** Ви можете тестувати функції в `gameActions.ts` ізольовано, передаючи їм фейковий стан. Ви також можете тестувати логіку оркестратора, мокаючи `gameActions`.
-   **Масштабованість:** Додавання нового режиму гри (наприклад, онлайн) зведеться до створення нового оркестратора (`onlineGameOrchestrator`), який буде використовувати ту саму бібліотеку чистих дій з `gameActions.ts`.

**Що протестувати:**
Оскільки ми зачепили ядро ігрового циклу, потрібне повне регресійне тестування:
1.  Початок нової гри.
2.  Зміна розміру дошки (з рахунком і без).
3.  Хід гравця та хід комп'ютера.
4.  Нарахування балів та штрафів.
5.  Завершення гри (програш, перемога через "немає ходів").
6.  Запуск реплею після гри.