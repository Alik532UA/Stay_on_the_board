// === GAME BOARD COMPONENT ===
import { BaseComponent } from './base-component.js';
import { stateManager } from '../state-manager.js';
import { t } from '../localization.js';
import { GameControlsComponent } from './game-controls-component.js';
import { createEmptyBoard, findPiece, getAllValidMoves } from '../game-core.js';

export class GameBoardComponent extends BaseComponent {
    constructor(element) {
        super(element);
        this.subscribeToGameState(); // <-- Перенесено з render
    }

    render() {
        const boardSize = stateManager?.getState('game.boardSize') || 3;
        console.log('[GameBoardComponent] render: boardSize =', boardSize);
        
        // Валідація розміру дошки
        if (boardSize < 2 || boardSize > 9) {
            console.error('[GameBoardComponent] Invalid board size in render:', boardSize);
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
            console.log('[GameBoardComponent] Board size mismatch or no board, recreating board');
            // Створюємо нову дошку з правильним розміром
            const newBoard = createEmptyBoard(boardSize);
            
            // Перевіряємо, чи дошка була створена успішно
            if (!newBoard) {
                console.error('[GameBoardComponent] Failed to create board with size:', boardSize);
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
            console.log('[GameBoardComponent] Syncing game.showingAvailableMoves with settings.showMoves:', showMoves);
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
        
        console.log('[GameBoardComponent] render: кінець');
    }
    
    subscribeToGameState() {
        // Підписка на зміни розміру дошки - використовуємо BaseComponent.subscribe
        this.subscribe('game.boardSize', (size) => {
            console.log('[GameBoardComponent] game.boardSize changed to:', size);
            
            // Валідація розміру дошки
            if (size < 2 || size > 9) {
                console.error('[GameBoardComponent] Invalid board size in subscription:', size);
                return;
            }
            
            // При зміні розміру дошки повністю перерендерюємо компонент
            this.render();
            
            // Видалено: не рендеримо контролі вручну
            // if (window.gameControlsComponent) {
            //     console.log('[GameBoardComponent] Re-rendering controls component due to board size change');
            //     window.gameControlsComponent.render();
            // }
        });
        
        // Підписка на зміни дошки
        this.subscribe('game.board', (board) => {
            const boardSize = stateManager.getState('game.boardSize');
            console.log('[GameBoardComponent] game.board changed, boardSize:', boardSize);
            
            // Валідація розміру дошки
            if (boardSize < 2 || boardSize > 9) {
                console.error('[GameBoardComponent] Invalid board size in board subscription:', boardSize);
                return;
            }
            
            this.renderBoard(board, boardSize);
        });
        
        // Підписка на зміни підсвічених ходів
        this.subscribe('game.highlightedMoves', () => {
            const gameState = stateManager.getState('game');
            console.log('[GameBoardComponent] game.highlightedMoves changed');
            
            // Валідація розміру дошки
            if (gameState.boardSize < 2 || gameState.boardSize > 9) {
                console.error('[GameBoardComponent] Invalid board size in highlightedMoves subscription:', gameState.boardSize);
                return;
            }
            
            this.renderBoard(gameState.board, gameState.boardSize);
        });
        
        // Підписка на зміни показу доступних ходів
        this.subscribe('game.showingAvailableMoves', () => {
            const gameState = stateManager.getState('game');
            console.log('[GameBoardComponent] game.showingAvailableMoves changed');
            
            // Валідація розміру дошки
            if (gameState.boardSize < 2 || gameState.boardSize > 9) {
                console.error('[GameBoardComponent] Invalid board size in showingAvailableMoves subscription:', gameState.boardSize);
                return;
            }
            
            this.renderBoard(gameState.board, gameState.boardSize);
        });
        
        // Додаткова підписка на зміни налаштувань показу ходів
        this.subscribe('settings.showMoves', (showMoves) => {
            const gameState = stateManager.getState('game');
            console.log('[GameBoardComponent] settings.showMoves changed to:', showMoves);
            
            // Синхронізуємо стан гри
            stateManager.setState('game.showingAvailableMoves', showMoves);
            
            // Валідація розміру дошки
            if (gameState.boardSize < 2 || gameState.boardSize > 9) {
                console.error('[GameBoardComponent] Invalid board size in settings.showMoves subscription:', gameState.boardSize);
                return;
            }
            
            this.renderBoard(gameState.board, gameState.boardSize);
        });
        
        // Підписка на зміни доступних ходів
        this.subscribe('game.availableMoves', () => {
            const gameState = stateManager.getState('game');
            console.log('[GameBoardComponent] game.availableMoves changed');
            
            // Валідація розміру дошки
            if (gameState.boardSize < 2 || gameState.boardSize > 9) {
                console.error('[GameBoardComponent] Invalid board size in availableMoves subscription:', gameState.boardSize);
                return;
            }
            
            this.renderBoard(gameState.board, gameState.boardSize);
        });
        
        // Підписка на зміни заблокованих клітинок
        this.subscribe('game.blockedCells', () => {
            const gameState = stateManager.getState('game');
            console.log('[GameBoardComponent] game.blockedCells changed');
            
            // Валідація розміру дошки
            if (gameState.boardSize < 2 || gameState.boardSize > 9) {
                console.error('[GameBoardComponent] Invalid board size in blockedCells subscription:', gameState.boardSize);
                return;
            }
            
            this.renderBoard(gameState.board, gameState.boardSize);
        });
        
        // Підписка на зміни режиму заблокованих клітинок
        this.subscribe('settings.blockedMode', () => {
            const gameState = stateManager.getState('game');
            console.log('[GameBoardComponent] settings.blockedMode changed');
            
            // Валідація розміру дошки
            if (gameState.boardSize < 2 || gameState.boardSize > 9) {
                console.error('[GameBoardComponent] Invalid board size in blockedMode subscription:', gameState.boardSize);
                return;
            }
            
            this.renderBoard(gameState.board, gameState.boardSize);
        });
    }

    renderControls() {
        const controlsEl = this.element.querySelector('#game-controls');
        if (controlsEl) {
            this.controlsComponent = new GameControlsComponent(controlsEl);
            this.controlsComponent.render();
            window.gameControlsComponent = this.controlsComponent; // Expose globally
        } else {
            console.error('[GameBoardComponent] Controls element not found');
        }
    }

    bindEvents() {
        const mainMenuBtn = this.element.querySelector('#btn-main-menu');
        if (mainMenuBtn) {
            mainMenuBtn.addEventListener('click', () => {
                stateManager.navigateTo('mainMenu');
            });
        } else {
            console.error('[GameBoardComponent] Main menu button not found');
        }
        const boardSizeSelect = this.element.querySelector('#board-size-select');
        if (boardSizeSelect) {
            boardSizeSelect.addEventListener('change', (e) => {
            const newSize = parseInt(e.target.value);
            console.log('[GameBoardComponent] Board size dropdown changed to:', newSize);
            
            // Валідація розміру дошки
            if (newSize < 2 || newSize > 9) {
                console.error('[GameBoardComponent] Invalid board size:', newSize);
                return;
            }
            
            // Оновлюємо розмір дошки в стані - це автоматично викличе підписку
            stateManager.setState('game.boardSize', newSize);
            // НЕ викликаємо тут this.render()!
            
            // Додаткова перевірка, чи зміна розміру дошки спрацювала
            setTimeout(() => {
                const actualSize = stateManager.getState('game.boardSize');
                if (actualSize !== newSize) {
                    console.error('[GameBoardComponent] Board size change failed:', actualSize, 'expected:', newSize);
                }
            }, 10);
            
            // Додаткова перевірка через невелику затримку
            setTimeout(() => {
                const currentBoardSize = stateManager.getState('game.boardSize');
                const currentBoard = stateManager.getState('game.board');
                console.log('[GameBoardComponent] Verification after board size change:', {
                    expectedSize: newSize,
                    actualSize: currentBoardSize,
                    boardExists: Array.isArray(currentBoard),
                    boardLength: currentBoard?.length
                });
                
                // Додаткова перевірка, чи дошка відображається правильно
                const boardElement = this.element.querySelector('#game-board');
                if (boardElement) {
                    const computedStyle = window.getComputedStyle(boardElement);
                    console.log('[GameBoardComponent] Board element styles:', {
                        gridTemplateColumns: computedStyle.gridTemplateColumns,
                        gridTemplateRows: computedStyle.gridTemplateRows,
                        childElementCount: boardElement.children.length
                    });
                }
            }, 50);
            
            console.log('[GameBoardComponent] Board size change processed');
            // НЕ викликаємо тут this.render()!
            });
        } else {
            console.error('[GameBoardComponent] Board size select not found');
        }
        // TODO: Додати логіку для кнопки "Зробити хід" якщо потрібно
    }

    renderBoard(board, boardSize) {
        if (!Array.isArray(board)) {
            console.error('[GameBoardComponent] renderBoard: board is not an array:', board);
            return;
        }
        
        // Валідація розміру дошки
        if (boardSize < 2 || boardSize > 9) {
            console.error('[GameBoardComponent] renderBoard: invalid board size:', boardSize);
            return;
        }
        
        const boardEl = this.element.querySelector('#game-board');
        if (!boardEl) {
            console.error('[GameBoardComponent] renderBoard: board element not found');
            return;
        }
        
        console.log('[GameBoardComponent] renderBoard called with boardSize:', boardSize, 'board length:', board.length);
        
        // Очищаємо дошку
        boardEl.innerHTML = '';
        
        // Встановлюємо grid layout
        boardEl.style.gridTemplateColumns = `repeat(${boardSize}, 1fr)`;
        boardEl.style.gridTemplateRows = `repeat(${boardSize}, 1fr)`;
        
        const highlightedMoves = stateManager.getState('game.highlightedMoves') || [];
        const showMoves = stateManager.getState('game.showingAvailableMoves');
        const availableMoves = stateManager.getState('game.availableMoves') || [];
        const blockedCells = stateManager.getState('game.blockedCells') || [];
        const blockedMode = stateManager.getState('settings.blockedMode') || false;
        console.log('[DIAG] blockedCells для render:', blockedCells, 'blockedMode:', blockedMode);
        
        console.log('[GameBoardComponent] renderBoard - showMoves:', showMoves, 'highlightedMoves count:', highlightedMoves.length, 'availableMoves count:', availableMoves.length);
        
        // Якщо показ ходів увімкнено, але highlightedMoves порожній, використовуємо availableMoves
        let movesToShow = showMoves ? (highlightedMoves.length > 0 ? highlightedMoves : availableMoves) : [];
        
        // Додаткова перевірка: якщо показ ходів увімкнено, але movesToShow порожній, спробуємо обчислити ходи
        if (showMoves && movesToShow.length === 0) {
            console.log('[GameBoardComponent] No moves to show, trying to compute available moves');
            const piece = findPiece(board, 1);
            if (piece) {
                const computedMoves = getAllValidMoves(board, piece.row, piece.col, 1);
                console.log('[GameBoardComponent] Computed moves:', computedMoves.length);
                movesToShow = computedMoves;
            }
        }
        
        // Створюємо клітинки
        let cellsCreated = 0;
        for (let i = 0; i < boardSize; i++) {
            for (let j = 0; j < boardSize; j++) {
                const cell = document.createElement('div');
                cell.className = `game-board-cell ${(i + j) % 2 === 0 ? 'light' : 'dark'}`;

                const isAvailable = showMoves && movesToShow.some(m => m.newRow === i && m.newCol === j);
                if (isAvailable) {
                    cell.classList.add('cell-available');
                }

                // === Перевірка заблокованої клітинки ПЕРША ===
                if (blockedMode && blockedCells.some(cell => cell.row === i && cell.col === j)) {
                    cell.classList.add('cell-blocked');
                    cell.innerHTML = '<span class="blocked-symbol">✗</span>';
                } else if (board[i] && board[i][j] === 1) {
                    cell.innerHTML = '<span class="game-board-piece crown">👑</span>';
                } else if (board[i] && board[i][j] === 2) {
                    cell.innerHTML = '<span class="game-board-piece black">⚫</span>';
                }

                boardEl.appendChild(cell);
                cellsCreated++;
            }
        }
        
        console.log('[GameBoardComponent] renderBoard completed, cells created:', cellsCreated, 'expected:', boardSize * boardSize);
        
        // Додаткова перевірка
        if (cellsCreated !== boardSize * boardSize) {
            console.error('[GameBoardComponent] renderBoard: cell count mismatch:', cellsCreated, 'expected:', boardSize * boardSize);
        }
    }
    
    destroy() {
        console.log('[GameBoardComponent] destroy');
        if (this.controlsComponent) {
            this.controlsComponent.destroy();
        }
        super.destroy();
    }
} 