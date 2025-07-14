// === GAME BOARD COMPONENT ===
import { BaseComponent } from './base-component.js';
import { stateManager } from '../state-manager.js';
import { t } from '../localization.js';
import { GameControlsComponent } from './game-controls-component.js';
import { createEmptyBoard, findPiece, getAllValidMoves } from '../game-core.js';
import { Logger } from '../utils/logger.js';

export class GameBoardComponent extends BaseComponent {
    constructor(element) {
        super(element);
        this.subscribeToGameState(); // <-- Перенесено з render
    }

    render() {
        Logger.info('[GameBoardComponent] render: початок');
        const boardSize = stateManager?.getState('game.boardSize') || 3;
        Logger.debug('[GameBoardComponent] render: boardSize =', { boardSize });
        
        // Валідація розміру дошки
        if (boardSize < 2 || boardSize > 9) {
            Logger.error('[GameBoardComponent] Invalid board size in render:', { boardSize });
            return;
        }
        
        // Створюємо базову розмітку без самої дошки
        this.element.innerHTML = `
            <div class="game-board-container">
                <div class="game-board-top-row">
                    <button id="btn-main-menu" class="main-menu-btn" title="Головне меню">
                        <img src="img/MainMenu.png" alt="Головне меню" class="main-menu-btn-img" />
                    </button>
                    <select id="board-size-select" class="board-size-select">
                        ${Array.from({length:8},(_,i)=>i+2).map(n=>`<option value="${n}" ${n===boardSize?'selected':''}>${n}x${n}</option>`).join('')}
                    </select>
                </div>
                <div class="board-bg-wrapper">
                    <div id="game-board" class="game-board"></div>
                </div>
                <!-- GameControlsComponent більше не рендериться тут -->
            </div>
        `;
        this.bindEvents();
        
        // Гарантовано активую гру та режим, щоб дошка з'явилася
        const currentGameState = stateManager.getState('game');
        // Якщо режим гри не встановлено, встановлюємо vsComputer за замовчуванням
        if (!currentGameState.gameMode) {
            stateManager.setState('game.gameMode', 'vsComputer');
        }
        
        // Перевіряємо, чи дошка відповідає поточному розміру
        if (!Array.isArray(currentGameState.board) || currentGameState.board.length !== boardSize) {
            Logger.info('[GameBoardComponent] Board size mismatch or no board, recreating board', { boardSize });
            // Створюємо нову дошку з правильним розміром
            const newBoard = createEmptyBoard(boardSize);
            
            // Перевіряємо, чи дошка була створена успішно
            if (!newBoard) {
                Logger.error('[GameBoardComponent] Failed to create board with size:', { boardSize });
                return;
            }
            
            const randomRow = Math.floor(Math.random() * boardSize);
            const randomCol = Math.floor(Math.random() * boardSize);
            newBoard[randomRow][randomCol] = 1;
            stateManager.setState('game.board', newBoard);
            this.renderBoard(newBoard, boardSize);
        } else {
            this.renderBoard(currentGameState.board, currentGameState.boardSize);
        }
        
        // Якщо дошка ще не ініціалізована, ініціалізуємо гру через GameLogic
        if (!Array.isArray(currentGameState.board)) {
            window.gameLogic?.onGameStart();
        }
        
        // Додаткова перевірка синхронізації показу доступних ходів
        const settings = window.stateManager?.getState('settings') || {};
        const showMoves = (typeof settings.showMoves === 'undefined') ? true : settings.showMoves;
        const currentShowingMoves = window.stateManager?.getState('game.showingAvailableMoves');
        
        if (currentShowingMoves !== showMoves) {
            Logger.debug('[GameBoardComponent] Syncing game.showingAvailableMoves with settings.showMoves:', { showMoves });
            window.stateManager?.setState('game.showingAvailableMoves', showMoves);
        }
        
        // Додатково викликаємо toggleAvailableMoves для оновлення підсвічування
        if (window.gameLogic && showMoves) {
            window.gameLogic.toggleAvailableMoves(showMoves);
        }
        
        // Синхронізуємо компонент керування
        if (window.gameControlsComponent) {
            window.gameControlsComponent.syncCheckboxWithSettings();
        }
        
        // Рендеримо компонент керування грою
        this.renderControls();
        
        Logger.debug('[GameBoardComponent] render: кінець');
    }
    
    subscribeToGameState() {
        // Підписка на зміни розміру дошки - використовуємо BaseComponent.subscribe
        this.subscribe('game.boardSize', (size) => {
            Logger.debug('[GameBoardComponent] game.boardSize changed to:', { size });
            
            // Валідація розміру дошки
            if (size < 2 || size > 9) {
                Logger.error('[GameBoardComponent] Invalid board size in subscription:', { size });
                return;
            }
            
            // При зміні розміру дошки повністю перерендерюємо компонент
            this.render();
            
            // Оновлюємо компонент контролів при зміні розміру дошки
            if (this.controlsComponent) {
                Logger.debug('[GameBoardComponent] Re-rendering controls component due to board size change');
                this.controlsComponent.render();
            }
        });
        
        // Підписка на зміни дошки
        this.subscribe('game.board', (board) => {
            const boardSize = stateManager.getState('game.boardSize');
            Logger.debug('[GameBoardComponent] game.board changed, boardSize:', { boardSize });
            
            // Валідація розміру дошки
            if (boardSize < 2 || boardSize > 9) {
                Logger.error('[GameBoardComponent] Invalid board size in board subscription:', { boardSize });
                return;
            }
            
            this.renderBoard(board, boardSize);
        });
        
        // Підписка на зміни підсвічених ходів
        this.subscribe('game.highlightedMoves', () => {
            const gameState = stateManager.getState('game');
            Logger.debug('[GameBoardComponent] game.highlightedMoves changed');
            
            // Валідація розміру дошки
            if (gameState.boardSize < 2 || gameState.boardSize > 9) {
                Logger.error('[GameBoardComponent] Invalid board size in highlightedMoves subscription:', { boardSize: gameState.boardSize });
                return;
            }
            
            this.renderBoard(gameState.board, gameState.boardSize);
        });
        
        // Підписка на зміни показу доступних ходів
        this.subscribe('game.showingAvailableMoves', () => {
            const gameState = stateManager.getState('game');
            Logger.debug('[GameBoardComponent] game.showingAvailableMoves changed');
            
            // Валідація розміру дошки
            if (gameState.boardSize < 2 || gameState.boardSize > 9) {
                Logger.error('[GameBoardComponent] Invalid board size in showingAvailableMoves subscription:', { boardSize: gameState.boardSize });
                return;
            }
            
            this.renderBoard(gameState.board, gameState.boardSize);
        });
        
        // Додаткова підписка на зміни налаштувань показу ходів
        this.subscribe('settings.showMoves', (showMoves) => {
            const gameState = stateManager.getState('game');
            Logger.debug('[GameBoardComponent] settings.showMoves changed to:', { showMoves });
            
            // Синхронізуємо стан гри
            stateManager.setState('game.showingAvailableMoves', showMoves);
            
            // Валідація розміру дошки
            if (gameState.boardSize < 2 || gameState.boardSize > 9) {
                Logger.error('[GameBoardComponent] Invalid board size in settings.showMoves subscription:', { boardSize: gameState.boardSize });
                return;
            }
            
            this.renderBoard(gameState.board, gameState.boardSize);
        });
        
        // Підписка на зміни доступних ходів
        this.subscribe('game.availableMoves', () => {
            const gameState = stateManager.getState('game');
            Logger.debug('[GameBoardComponent] game.availableMoves changed');
            
            // Валідація розміру дошки
            if (gameState.boardSize < 2 || gameState.boardSize > 9) {
                Logger.error('[GameBoardComponent] Invalid board size in availableMoves subscription:', { boardSize: gameState.boardSize });
                return;
            }
            
            this.renderBoard(gameState.board, gameState.boardSize);
        });
        
        // Підписка на зміни заблокованих клітинок
        this.subscribe('game.blockedCells', () => {
            const gameState = stateManager.getState('game');
            const blockedCells = gameState.blockedCells || [];
            const blockedMode = stateManager.getState('settings.blockedMode') || false;
            
            Logger.debug('[GameBoardComponent] game.blockedCells changed:', { 
                blockedCellsCount: blockedCells.length, 
                blockedCells,
                blockedMode 
            });
            
            // Валідація розміру дошки
            if (gameState.boardSize < 2 || gameState.boardSize > 9) {
                Logger.error('[GameBoardComponent] Invalid board size in blockedCells subscription:', { boardSize: gameState.boardSize });
                return;
            }
            
            this.renderBoard(gameState.board, gameState.boardSize);
        });
        
        // Підписка на зміни режиму заблокованих клітинок
        this.subscribe('settings.blockedMode', () => {
            const gameState = stateManager.getState('game');
            const blockedMode = stateManager.getState('settings.blockedMode') || false;
            const blockedCells = gameState.blockedCells || [];
            
            Logger.debug('[GameBoardComponent] settings.blockedMode changed:', { 
                blockedMode, 
                blockedCellsCount: blockedCells.length 
            });
            
            // Валідація розміру дошки
            if (gameState.boardSize < 2 || gameState.boardSize > 9) {
                Logger.error('[GameBoardComponent] Invalid board size in blockedMode subscription:', { boardSize: gameState.boardSize });
                return;
            }
            
            this.renderBoard(gameState.board, gameState.boardSize);
        });
    }

    renderControls() {
        // Шукаємо елемент контролів в глобальному DOM, а не в елементі компонента
        const controlsEl = document.getElementById('game-controls');
        if (controlsEl) {
            this.controlsComponent = new GameControlsComponent(controlsEl);
            this.controlsComponent.render();
            window.gameControlsComponent = this.controlsComponent; // Expose globally
            Logger.debug('[GameBoardComponent] Game controls component rendered successfully');
        } else {
            Logger.error('[GameBoardComponent] Controls element not found in global DOM');
        }
    }

    bindEvents() {
        const mainMenuBtn = this.element.querySelector('#btn-main-menu');
        if (mainMenuBtn) {
            mainMenuBtn.addEventListener('click', () => {
                Logger.info('[GameBoardComponent] Main menu button clicked');
                stateManager.navigateTo('mainMenu');
            });
        } else {
            Logger.error('[GameBoardComponent] Main menu button not found');
        }
        const boardSizeSelect = this.element.querySelector('#board-size-select');
        if (boardSizeSelect) {
            boardSizeSelect.addEventListener('change', (e) => {
            const newSize = parseInt(e.target.value);
            Logger.info('[GameBoardComponent] Board size dropdown changed to:', { newSize });
            console.log('[GameBoardComponent] Board size dropdown changed to:', { newSize });
            
            // Валідація розміру дошки
            if (newSize < 2 || newSize > 9) {
                Logger.error('[GameBoardComponent] Invalid board size:', { newSize });
                return;
            }
            
            // Оновлюємо розмір дошки в стані - це автоматично викличе підписку
            stateManager.setState('game.boardSize', newSize);
            // НЕ викликаємо тут this.render()!
            
            // Додаткова перевірка, чи зміна розміру дошки спрацювала
            setTimeout(() => {
                const actualSize = stateManager.getState('game.boardSize');
                if (actualSize !== newSize) {
                    Logger.error('[GameBoardComponent] Board size change failed:', { actualSize, expected: newSize });
                }
            }, 10);
            
            // Додаткова перевірка через невелику затримку
            setTimeout(() => {
                const currentBoardSize = stateManager.getState('game.boardSize');
                const currentBoard = stateManager.getState('game.board');
                Logger.debug('[GameBoardComponent] Verification after board size change:', {
                    expectedSize: newSize,
                    actualSize: currentBoardSize,
                    boardExists: Array.isArray(currentBoard),
                    boardLength: currentBoard?.length
                });
                
                // Додаткова перевірка, чи дошка відображається правильно
                const boardElement = this.element.querySelector('#game-board');
                if (boardElement) {
                    const computedStyle = window.getComputedStyle(boardElement);
                    Logger.debug('[GameBoardComponent] Board element styles:', {
                        gridTemplateColumns: computedStyle.gridTemplateColumns,
                        gridTemplateRows: computedStyle.gridTemplateRows,
                        childElementCount: boardElement.children.length
                    });
                }
            }, 50);
            
            Logger.debug('[GameBoardComponent] Board size change processed');
            // НЕ викликаємо тут this.render()!
            });
        } else {
            Logger.error('[GameBoardComponent] Board size select not found');
        }
        // TODO: Додати логіку для кнопки "Зробити хід" якщо потрібно
    }

    renderBoard(board, boardSize) {
        Logger.debug('[GameBoardComponent] renderBoard called with boardSize:', { boardSize, boardLength: board?.length });
        
        const gameBoard = this.element.querySelector('#game-board');
        if (!gameBoard) {
            Logger.error('[GameBoardComponent] Game board element not found');
            return;
        }
        if (!Array.isArray(board) || board.length !== boardSize) {
            Logger.error('[GameBoardComponent] Invalid board array in renderBoard, auto-fix:', { board, boardSize });
            const newBoard = createEmptyBoard(boardSize);
            const randomRow = Math.floor(Math.random() * boardSize);
            const randomCol = Math.floor(Math.random() * boardSize);
            newBoard[randomRow][randomCol] = 1;
            stateManager.setState('game.board', newBoard);
            this.renderBoard(newBoard, boardSize);
            return;
        }
        // --- Дістаємо доступні та підсвічені ходи ---
        const availableMoves = stateManager?.getState('game.availableMoves') || [];
        const highlightedMoves = stateManager?.getState('game.highlightedMoves') || [];
        const showingAvailableMoves = stateManager?.getState('game.showingAvailableMoves') || false;
        Logger.debug('[GameBoardComponent] renderBoard - moves state:', { 
            availableMovesCount: availableMoves.length, 
            highlightedMovesCount: highlightedMoves.length, 
            showingAvailableMoves,
            availableMoves: availableMoves.map(m => ({ direction: m.direction, distance: m.distance, newRow: m.newRow, newCol: m.newCol })),
            highlightedMoves: highlightedMoves.map(m => ({ direction: m.direction, distance: m.distance, newRow: m.newRow, newCol: m.newCol }))
        });
        gameBoard.innerHTML = '';
        gameBoard.style.gridTemplateColumns = `repeat(${boardSize}, 1fr)`;
        gameBoard.style.gridTemplateRows = `repeat(${boardSize}, 1fr)`;
        let cellsCreated = 0;
        const expectedCells = boardSize * boardSize;
        for (let row = 0; row < boardSize; row++) {
            for (let col = 0; col < boardSize; col++) {
                const cell = document.createElement('div');
                cell.className = 'board-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                if ((row + col) % 2 === 0) {
                    cell.classList.add('cell-light');
                } else {
                    cell.classList.add('cell-dark');
                }
                const cellValue = board[row][col];
                // --- Фігура ---
                if (cellValue === 1) {
                    cell.classList.add('player-piece');
                    cell.innerHTML = '<span class="crown">👑</span>';
                } else if (cellValue === 2) {
                    cell.classList.add('player-piece', 'player2');
                    cell.innerHTML = '<span class="crown">👑</span>';
                } else {
                    cell.classList.add('empty-cell');
                    // --- Доступні ходи ---
                    const isHighlighted = highlightedMoves.some(move => move.newRow === row && move.newCol === col);
                    const isAvailable = availableMoves.some(move => move.newRow === row && move.newCol === col);
                    
                    if (isHighlighted) {
                        cell.classList.add('highlighted-move');
                        cell.innerHTML = '<span class="move-dot move-dot-highlighted"></span>';
                    } else if (isAvailable && showingAvailableMoves) {
                        cell.classList.add('available-move');
                        cell.innerHTML = '<span class="move-dot"></span>';
                    } else {
                        cell.innerHTML = '';
                    }
                }
                gameBoard.appendChild(cell);
                cellsCreated++;
            }
        }
        Logger.debug('[GameBoardComponent] renderBoard completed, cells created:', { cellsCreated, expected: expectedCells });
    }
    
    destroy() {
        Logger.debug('[GameBoardComponent] destroy');
        if (this.controlsComponent) {
            this.controlsComponent.destroy();
            this.controlsComponent = null;
        }
        // Очищаємо глобальну змінну
        if (window.gameControlsComponent === this.controlsComponent) {
            window.gameControlsComponent = null;
        }
        super.destroy();
    }
} 