// === Покращена ігрова логіка ===
// Використовує нову архітектуру з State Manager та компонентами

import { stateManager } from './state-manager.js';
import { findPiece, hasValidMoves, getAllValidMoves, getDirectionDelta, getDirectionText, getDirectionArrow, createEmptyBoard } from './game-core.js';
import { t } from './localization.js';
import { speakMove, speakGameMessage, stopSpeaking, initVoices, getVoicesForLanguage, setVoiceForLanguage, getCurrentVoice } from './speech.js';
import { eventBus } from './event-bus.js';
import { Logger } from './utils/logger.js';

export class GameLogic {
    constructor() {
        Logger.debug('GameLogic: constructor');
        this.isInitialized = false;
        this.gameBoardComponent = null;
        this.gameControlsComponent = null;
        this.speechEnabled = false;
        
        this.init();
    }
    
    init() {
        if (this.isInitialized) return;
        
        Logger.info('[GameLogic] Initializing...');
        this.log('Initializing Game Logic');
        
        // Підписуємося на зміни стану гри
        this.subscribeToGameState();
        
        // Ініціалізуємо мову
        this.initSpeech();
        
        this.isInitialized = true;
        this.log('Game Logic initialized');
    }
    
    subscribeToGameState() {
        Logger.debug('GameLogic: subscribeToGameState');
        // Підписка на зміни стану гри
        stateManager.subscribe('game.isActive', (isActive) => {
            if (isActive) {
                this.onGameStart();
            } else {
                this.onGameEnd();
            }
        });
        
        stateManager.subscribe('game.selectedDirection', (direction) => {
            this.onDirectionSelected(direction);
        });
        
        stateManager.subscribe('game.selectedDistance', (distance) => {
            this.onDistanceSelected(distance);
        });
        
        // Підписка на зміни розміру дошки
        stateManager.subscribe('game.boardSize', (newSize) => {
            Logger.info('[GameLogic] Board size changed to:', { newSize });
            
            // Валідація розміру дошки
            if (newSize < 2 || newSize > 9) {
                Logger.error('[GameLogic] Invalid board size:', { newSize });
                return;
            }
            
            // Скидаємо вибраний напрямок та відстань при зміні розміру дошки
            stateManager.setState('game.selectedDirection', null);
            stateManager.setState('game.selectedDistance', null);
            stateManager.setState('game.highlightedMoves', []);
            
            // Створюємо нову дошку з правильним розміром
            const newBoard = createEmptyBoard(newSize);
            
            // Перевіряємо, чи дошка була створена успішно
            if (!newBoard) {
                Logger.error('[GameLogic] Failed to create board with size:', { newSize });
                return;
            }
            
            const randomRow = Math.floor(Math.random() * newSize);
            const randomCol = Math.floor(Math.random() * newSize);
            newBoard[randomRow][randomCol] = 1;
            stateManager.setState('game.board', newBoard);
            
            // Додаткова перевірка через невелику затримку
            setTimeout(() => {
                const currentBoard = stateManager.getState('game.board');
                Logger.debug('[GameLogic] Verification after board recreation:', {
                    expectedSize: newSize,
                    boardExists: Array.isArray(currentBoard),
                    boardLength: currentBoard?.length,
                    hasPiece: currentBoard ? findPiece(currentBoard, 1) : null
                });
            }, 100);
            
            // Оновлюємо доступні ходи при зміні розміру дошки
            this.updateAvailableMoves();
            // Показуємо повідомлення про новий розмір дошки
            this.showGameMessage();
        });
        
        // Підписка на подію підтвердження ходу через EventBus
        eventBus.on('game:confirmMove', () => {
            Logger.info('[GameLogic] game:confirmMove received');
            Logger.debug('[GameLogic] Calling processPlayerMove');
            this.processPlayerMove();
            Logger.debug('[GameLogic] processPlayerMove completed');
        });
        
        stateManager.subscribe('game.noMoves', (noMoves) => {
            if (noMoves) {
                this.checkNoMoves();
            }
        });
        
        stateManager.subscribe('game.selectedMove', (move) => {
            if (move) {
                this.executeMove(move);
            }
        });
        
        stateManager.subscribe('settings.speechEnabled', (enabled) => {
            this.speechEnabled = enabled;
        });
        
        // Підписка на зміни налаштування показу доступних ходів
        stateManager.subscribe('settings.showMoves', (show) => {
            this.toggleAvailableMoves(show);
        });
        
        stateManager.subscribe('settings.blockedMode', (blocked) => {
            this.toggleBlockedMode(blocked);
        });
    }
    
    // Ініціалізація мови
    async initSpeech() {
        Logger.debug('[GameLogic] initSpeech called');
        try {
            await initVoices();
            this.speechEnabled = stateManager.getState('settings.speechEnabled');
            this.log('Speech initialized', { enabled: this.speechEnabled });
        } catch (error) {
            this.log('Speech initialization failed', { error });
        }
    }
    
    // Обробка початку гри
    onGameStart() {
        console.log('[GameLogic] onGameStart called');
        const gameState = stateManager.getState('game');
        const settings = stateManager.getState('settings');
        const gameMode = gameState.gameMode;
        console.log('[onGameStart] gameMode:', gameMode, 'settings.showMoves (до):', settings.showMoves);

        // Явно вмикаємо показ доступних ходів для vsComputer
        if (gameMode === 'vsComputer') {
            stateManager.setState('settings.showMoves', true);
            console.log('[onGameStart] Встановлено settings.showMoves = true для vsComputer');
        }
        // Перевіряємо після встановлення
        console.log('[onGameStart] settings.showMoves (після):', stateManager.getState('settings.showMoves'));

        const boardSize = stateManager.getState('game.boardSize') || 3;
        console.log('[GameLogic] onGameStart, boardSize =', boardSize);
        this.log('Game started', { gameState });

        // Валідація розміру дошки
        if (boardSize < 2 || boardSize > 9) {
            console.error('[GameLogic] Invalid board size in onGameStart:', boardSize);
            return;
        }

        // --- Ініціалізація дошки, якщо порожня або неправильного розміру ---
        let board = gameState.board;
        if (!board || !Array.isArray(board) || board.length !== boardSize) {
            console.log('[GameLogic] Creating new board with size:', boardSize);
            board = createEmptyBoard(boardSize);
            
            // Перевіряємо, чи дошка була створена успішно
            if (!board) {
                console.error('[GameLogic] Failed to create board with size:', boardSize);
                return;
            }
            
            // Ставимо фігуру випадково на дошці
            const randomRow = Math.floor(Math.random() * boardSize);
            const randomCol = Math.floor(Math.random() * boardSize);
            board[randomRow][randomCol] = 1;
            stateManager.setState('game.board', board);
            console.log('[GameLogic] New board created and set in state');
        }
        
        // Ініціалізація заблокованих клітинок при початку нової гри
        const blockedMode = stateManager.getState('settings.blockedMode') || false;
        Logger.debug('[GameLogic] onGameStart - blockedMode setting:', { blockedMode });
        
        if (blockedMode) {
            const blockedCells = this.generateBlockedCells(boardSize);
            stateManager.setState('game.blockedCells', blockedCells);
            Logger.debug('[GameLogic] onGameStart - initialized blocked cells:', { blockedCellsCount: blockedCells.length });
        } else {
            stateManager.setState('game.blockedCells', []);
            Logger.debug('[GameLogic] onGameStart - cleared blocked cells');
        }

        // === ГАРАНТОВАНО ініціалізуємо доступні ходи та підсвічування ===
        const piece = findPiece(board, 1);
        if (piece) {
            // Отримуємо заблоковані клітинки та режим
            const blockedCells = stateManager.getState('game.blockedCells') || [];
            const currentBlockedMode = stateManager.getState('settings.blockedMode') || false;
            
            // Ініціалізуємо доступні ходи для поточного гравця (player 1) з урахуванням заблокованих клітинок
            const moves = getAllValidMoves(board, piece.row, piece.col, 1, blockedCells, currentBlockedMode);
            console.log('[GameLogic] onGameStart - found piece at:', piece.row, piece.col, 'blockedMode:', currentBlockedMode, 'blockedCells:', blockedCells.length, 'available moves:', moves.length);
            stateManager.setState('game.availableMoves', moves);
        } else {
            console.log('[GameLogic] onGameStart - no piece found');
            stateManager.setState('game.availableMoves', []);
        }
        
        // Встановлюємо стан показу доступних ходів відповідно до налаштувань
        const showMoves = stateManager.getState('settings.showMoves');
        console.log('[GameLogic] onGameStart - settings.showMoves:', showMoves);
        stateManager.setState('game.showingAvailableMoves', showMoves);
        
        // Оновлюємо доступні ходи та підсвічування
        this.updateAvailableMoves();
        
        // Додатково викликаємо toggleAvailableMoves для гарантованого оновлення підсвічування
        this.toggleAvailableMoves(showMoves);
        // Показуємо повідомлення
        this.showGameMessage();
        // Ініціалізуємо компоненти, якщо потрібно
        this.initComponents();
        
        // Додатково оновлюємо компонент керування, щоб синхронізувати чекбокс
        if (window.gameControlsComponent) {
            window.gameControlsComponent.render();
            window.gameControlsComponent.syncCheckboxWithSettings();
        }
        
        // Додаткова перевірка через невелику затримку, щоб переконатися, що все синхронізовано
        setTimeout(() => {
            const finalShowMoves = stateManager.getState('settings.showMoves');
            const finalShowingMoves = stateManager.getState('game.showingAvailableMoves');
            console.log('[GameLogic] Final sync check - settings.showMoves:', finalShowMoves, 'game.showingAvailableMoves:', finalShowingMoves);
            
            if (finalShowMoves !== finalShowingMoves) {
                console.log('[GameLogic] Fixing sync mismatch');
                stateManager.setState('game.showingAvailableMoves', finalShowMoves);
            }
        }, 100);
    }


    
    // Обробка закінчення гри
    onGameEnd() {
        console.log('[GameLogic] onGameEnd called');
        this.log('Game ended');
        
        // Зупиняємо мову
        if (this.speechEnabled) {
            stopSpeaking();
        }
        
        // Очищуємо доступні ходи
        stateManager.setState('game.availableMoves', []);
        stateManager.setState('game.highlightedMoves', []); // Очищаємо підсвічені ходи
        stateManager.setState('game.showingAvailableMoves', false);
    }
    
    // Обробка вибору напрямку
    onDirectionSelected(direction) {
        if (!direction) return;
        
        console.log('[GameLogic] onDirectionSelected called with:', direction);
        this.log('Direction selected', { direction });

        const distance = stateManager.getState('game.selectedDistance');
        const showingAvailableMoves = stateManager.getState('game.showingAvailableMoves');
        if (distance) {
            // Якщо відстань вже обрано, підсвічуємо конкретний хід
            const gameState = stateManager.getState('game');
            const move = (gameState.availableMoves || []).find(
                m => m.direction === direction && m.distance === distance
            );
            stateManager.setState('game.highlightedMoves', showingAvailableMoves && move ? [move] : []);
        } else {
            // Якщо відстань ще не обрано, підсвічуємо всі ходи з цим напрямком
            this.updateAvailableMovesForDirection(direction);
        }
    }
    
    // Обробка вибору дистанції
    onDistanceSelected(distance) {
        if (!distance) return;
        
        console.log('[GameLogic] onDistanceSelected called with:', distance);
        this.log('Distance selected', { distance });
        
        const direction = stateManager.getState('game.selectedDirection');
        const showingAvailableMoves = stateManager.getState('game.showingAvailableMoves');
        if (direction) {
            // Якщо напрямок вже обрано, підсвічуємо конкретний хід
            const gameState = stateManager.getState('game');
            const move = (gameState.availableMoves || []).find(
                m => m.direction === direction && m.distance === distance
            );
            stateManager.setState('game.highlightedMoves', showingAvailableMoves && move ? [move] : []);
        } else {
            // Якщо напрямок ще не обрано, підсвічуємо всі ходи з цією відстанню
            this.updateAvailableMovesForDistance(distance);
        }
    }
    
    // Оновлення доступних ходів
    updateAvailableMoves() {
        Logger.debug('[GameLogic] updateAvailableMoves called');
        const gameState = stateManager.getState('game');
        const board = gameState.board;
        if (!board || !Array.isArray(board)) {
            Logger.warn('[GameLogic] updateAvailableMoves: board is not ready');
            return;
        }
        const currentPlayer = gameState.currentPlayer;
        const gameMode = gameState.gameMode;
        const boardSize = gameState.boardSize;
        
        Logger.debug('[GameLogic] updateAvailableMoves - gameState:', { currentPlayer, gameMode, boardSize });
        
        // Валідація розміру дошки
        if (boardSize < 2 || boardSize > 9) {
            Logger.error('[GameLogic] Invalid board size in updateAvailableMoves:', { boardSize });
            return;
        }
        
        if (!board || board.length === 0) {
            Logger.debug('[GameLogic] No board or empty board, returning');
            return;
        }
        
        // Перевіряємо, чи розмір дошки відповідає очікуваному
        if (board.length !== boardSize) {
            Logger.debug('[GameLogic] Board size mismatch, board.length:', { boardLength: board.length, expected: boardSize });
            return;
        }
        
        // Знаходимо фігуру на дошці
        let piece;
        let logicPlayer = currentPlayer;
        if (gameMode === 'vsComputer') {
            // В грі з комп'ютером на дошці завжди є тільки одна фігура (player 1)
            piece = findPiece(board, 1);
            logicPlayer = 1; // ВАЖЛИВО: для всіх перевірок використовуємо piece 1
        } else {
            // В локальній грі шукаємо фігуру поточного гравця
            piece = findPiece(board, currentPlayer);
        }
        
        Logger.debug('[GameLogic] Found piece:', { piece });
        
        if (!piece) {
            Logger.debug('[GameLogic] No piece found, returning');
            return;
        }
        
        // Отримуємо заблоковані клітинки та режим
        const blockedCells = gameState.blockedCells || [];
        const blockedMode = stateManager.getState('settings.blockedMode') || false;
        
        // Отримуємо всі доступні ходи для piece 1 у vsComputer з урахуванням заблокованих клітинок
        const moves = getAllValidMoves(board, piece.row, piece.col, logicPlayer, blockedCells, blockedMode);
        Logger.debug('[GameLogic] updateAvailableMoves - piece at:', { row: piece.row, col: piece.col, logicPlayer, blockedMode, blockedCellsCount: blockedCells.length, movesCount: moves.length });
        stateManager.setState('game.availableMoves', moves); // завжди повний список
        
        // Перевіряємо поточний стан показу доступних ходів
        const showingAvailableMoves = stateManager.getState('game.showingAvailableMoves');
        Logger.debug('[GameLogic] updateAvailableMoves - showingAvailableMoves:', { showingAvailableMoves, movesCount: moves.length });
        
        // Оновлюємо підсвічені ходи тільки якщо є вибраний напрямок і відстань
        const direction = stateManager.getState('game.selectedDirection');
        const distance = stateManager.getState('game.selectedDistance');
        if (direction && distance) {
            // Якщо є вибраний напрямок і відстань, підсвічуємо тільки цей хід
            const move = moves.find(m => m.direction === direction && m.distance === distance);
            stateManager.setState('game.highlightedMoves', move ? [move] : []);
        } else {
            // Якщо немає вибраного напрямку або відстані, очищаємо підсвічені ходи
            stateManager.setState('game.highlightedMoves', []);
        }
        this.log('Available moves updated', { moves: moves.length, logicPlayer });
        Logger.debug('[GameLogic] Available moves set in state:', { availableMoves: stateManager.getState('game.availableMoves') });
        Logger.debug('[GameLogic] Highlighted moves set in state:', { highlightedMoves: stateManager.getState('game.highlightedMoves') });
    }

    // Оновлення підсвічених ходів для напрямку
    updateAvailableMovesForDirection(direction) {
        const gameState = stateManager.getState('game');
        const allMoves = gameState.availableMoves || [];
        const directionMoves = allMoves.filter(move => move.direction === direction);
        
        // Перевіряємо, чи є також вибрана відстань
        const distance = stateManager.getState('game.selectedDistance');
        if (distance) {
            // Якщо є і напрямок, і відстань, підсвічуємо тільки конкретний хід
            const move = directionMoves.find(m => m.distance === distance);
            stateManager.setState('game.highlightedMoves', move ? [move] : []);
        } else {
            // Якщо є тільки напрямок, очищаємо підсвічені ходи
            stateManager.setState('game.highlightedMoves', []);
        }
    }

    // Оновлення підсвічених ходів для дистанції
    updateAvailableMovesForDistance(distance) {
        const gameState = stateManager.getState('game');
        const allMoves = gameState.availableMoves || [];
        const distanceMoves = allMoves.filter(move => move.distance === distance);
        
        // Перевіряємо, чи є також вибраний напрямок
        const direction = stateManager.getState('game.selectedDirection');
        if (direction) {
            // Якщо є і напрямок, і відстань, підсвічуємо тільки конкретний хід
            const move = distanceMoves.find(m => m.direction === direction);
            stateManager.setState('game.highlightedMoves', move ? [move] : []);
        } else {
            // Якщо є тільки відстань, очищаємо підсвічені ходи
            stateManager.setState('game.highlightedMoves', []);
        }
    }
    
    // Перемикання показу доступних ходів
    toggleAvailableMoves(show) {
        Logger.debug('toggleAvailableMoves called, show =', { show });
        stateManager.setState('game.showingAvailableMoves', show);
        const gameState = stateManager.getState('game');
        if (!gameState.board || !Array.isArray(gameState.board)) {
            Logger.warn('[GameLogic] toggleAvailableMoves: board is not ready');
            return;
        }
        // Оновлюємо доступні ходи та підсвічування
        this.updateAvailableMoves();
        Logger.debug('[GameLogic] toggleAvailableMoves - final state - showingAvailableMoves:', { showingAvailableMoves: stateManager.getState('game.showingAvailableMoves'), highlightedMovesCount: stateManager.getState('game.highlightedMoves').length });
    }
    
    // Перемикання режиму заблокованих клітинок
    toggleBlockedMode(blocked) {
        const gameState = stateManager.getState('game');
        const board = gameState.board;
        
        Logger.debug('[GameLogic] toggleBlockedMode called with blocked:', { blocked, boardSize: board?.length });
        
        if (blocked) {
            // Додаємо заблоковані клітинки
            const blockedCells = this.generateBlockedCells(board.length);
            stateManager.setState('game.blockedCells', blockedCells);
            Logger.debug('[GameLogic] toggleBlockedMode: added blocked cells:', { blockedCellsCount: blockedCells.length });
        } else {
            // Видаляємо заблоковані клітинки
            stateManager.setState('game.blockedCells', []);
            Logger.debug('[GameLogic] toggleBlockedMode: cleared blocked cells');
        }
        
        // Оновлюємо доступні ходи з урахуванням заблокованих клітинок
        this.updateAvailableMoves();
    }
    
    // Генерація заблокованих клітинок
    generateBlockedCells(boardSize) {
        const blockedCells = [];
        const numBlocked = Math.floor(boardSize * boardSize * 0.1); // 10% клітинок
        
        Logger.debug('[GameLogic] generateBlockedCells called with boardSize:', { boardSize, numBlocked });
        
        for (let i = 0; i < numBlocked; i++) {
            let row, col;
            do {
                row = Math.floor(Math.random() * boardSize);
                col = Math.floor(Math.random() * boardSize);
            } while (blockedCells.some(cell => cell.row === row && cell.col === col));
            
            blockedCells.push({ row, col });
        }
        
        Logger.debug('[GameLogic] generateBlockedCells completed:', { blockedCellsCount: blockedCells.length, blockedCells });
        return blockedCells;
    }
    
    // Оновлення дошки з заблокованими клітинками
    updateBoardWithBlockedCells() {
        const gameState = stateManager.getState('game');
        const board = gameState.board;
        const blockedCells = gameState.blockedCells;
        
        // Створюємо нову дошку
        const newBoard = board.map(row => [...row]);
        
        // Додаємо заблоковані клітинки
        blockedCells.forEach(cell => {
            if (newBoard[cell.row] && newBoard[cell.row][cell.col] !== undefined) {
                newBoard[cell.row][cell.col] = 'blocked';
            }
        });
        
        stateManager.updateBoard(newBoard);
    }
    
    // Обробка ходу гравця
    processPlayerMove() {
        console.log('[GameLogic] processPlayerMove called');
        const gameState = stateManager.getState('game');
        const direction = gameState.selectedDirection;
        const distance = gameState.selectedDistance;
        const availableMoves = gameState.availableMoves;
        console.log('[GameLogic] direction:', direction, 'distance:', distance, 'availableMoves count:', availableMoves?.length);
        if (!direction || !distance) {
            this.showError('Будь ласка, виберіть напрямок та дистанцію');
            return;
        }
        // === ВИПРАВЛЕННЯ: Перевірка на вихід за межі дошки ===
        const board = gameState.board;
        const currentPlayer = gameState.currentPlayer;
        const gameMode = gameState.gameMode;
        let piece;
        let logicPlayer = currentPlayer;
        if (gameMode === 'vsComputer') {
            piece = findPiece(board, 1);
            logicPlayer = 1;
        } else {
            piece = findPiece(board, currentPlayer);
        }
        if (!piece) {
            this.showError('Фігура не знайдена на дошці');
            return;
        }
        const { dr, dc } = getDirectionDelta(direction);
        const newRow = piece.row + dr * distance;
        const newCol = piece.col + dc * distance;
        const boardSize = board.length;
        console.log('[GameLogic] Board size:', boardSize, 'New position:', newRow, newCol);
        if (newRow < 0 || newRow >= boardSize || newCol < 0 || newCol >= boardSize) {
            // === Завершити гру з модальним вікном ===
            const dirText = getDirectionText(direction, gameState.language || 'uk');
            const msg = `Ви спробували перемістити фігуру на ${distance} клітинку${distance > 1 ? '(-ки)' : ''} ${dirText} і вийшли за межі дошки.`;
            stateManager.showModal('Кінець гри', msg, [
                { text: 'Грати знову', class: 'primary', onClick: () => {
                    // Перезапускаємо гру з тими ж налаштуваннями
                    stateManager.setState('game.isActive', true);
                    // onGameStart автоматично ініціалізує гру через підписку
                } },
                { text: 'Головне меню', onClick: () => stateManager.navigateTo('mainMenu') }
            ]);
            stateManager.setState('game.isActive', false);
            if (this.speechEnabled) {
                speakGameMessage(msg);
            }
            this.log('Game ended (out of bounds move)', { newRow, newCol, direction, distance });
            return;
        }
        // === КІНЕЦЬ ВИПРАВЛЕННЯ ===
        const move = availableMoves.find(m => m.direction === direction && m.distance === distance);
        console.log('[GameLogic] found move:', move);
        if (!move) {
            this.showError('Недійсний хід');
            return;
        }
        this.executeMove(move);
        const mode = stateManager.getState('game.gameMode');
        console.log('[GameLogic] Game mode:', mode);
        console.log('[GameLogic] Current player after executeMove:', stateManager.getState('game.currentPlayer'));
        if (mode === 'vsComputer') {
            // Після ходу гравця одразу передаємо хід комп'ютеру
            console.log('[GameLogic] Setting currentPlayer to 2 for computer turn');
            stateManager.setState('game.currentPlayer', 2);
            this.updateAvailableMoves(); // Оновлюємо доступні ходи для комп'ютера
            console.log('[GameLogic] Current player after setting to 2:', stateManager.getState('game.currentPlayer'));
            console.log('[GameLogic] Scheduling computer move in 300ms');
            setTimeout(() => this.makeComputerMove(), 300); // невелика затримка для плавності
        } else {
            // Для локальної гри — стандартна зміна гравця
            this.switchPlayer();
        }
        stateManager.setState('game.selectedDirection', null);
        stateManager.setState('game.selectedDistance', null);
    }
    
    // Виконання ходу
    executeMove(move) {
        console.log('[GameLogic] executeMove called with:', move);
        const gameState = stateManager.getState('game');
        const board = gameState.board;
        const currentPlayer = gameState.currentPlayer;
        const gameMode = gameState.gameMode;
        
        console.log('[GameLogic] Current player:', currentPlayer, 'Game mode:', gameMode, 'Board size:', board.length);
        
        // Знаходимо фігуру на дошці
        let piece;
        let logicPlayer = currentPlayer;
        if (gameMode === 'vsComputer') {
            // В грі з комп'ютером на дошці завжди є тільки одна фігура (player 1)
            piece = findPiece(board, 1);
            logicPlayer = 1; // ВАЖЛИВО: для всіх перевірок використовуємо piece 1
        } else {
            // В локальній грі шукаємо фігуру поточного гравця
            piece = findPiece(board, currentPlayer);
        }
        
        if (!piece) {
            console.log('[GameLogic] No piece found, cannot execute move');
            return;
        }
        
        console.log('[GameLogic] Found piece at:', piece.row, piece.col);
        
        // Створюємо нову дошку (глибоке клонування)
        const newBoard = board.map(row => [...row]);
        console.log('[GameLogic] Original board size:', board.length);
        console.log('[GameLogic] Moving piece from:', piece.row, piece.col, 'to:', move.newRow, move.newCol);
        
        // Оголошення blockedCells і blockedMode тут
        const blockedCells = gameState.blockedCells || [];
        const blockedMode = stateManager.getState('settings.blockedMode') || false;
        console.log('[DIAG] executeMove: blockedMode =', blockedMode, 'blockedCells до =', blockedCells);
        
        // Видаляємо фігуру з поточної позиції
        newBoard[piece.row][piece.col] = 0;
        // Розміщуємо фігуру на новій позиції (завжди player 1, оскільки це одна фігура)
        newBoard[move.newRow][move.newCol] = 1;
        
        // Якщо увімкнено режим заблокованих клітинок, додаємо поточну позицію до заблокованих
        let updatedBlockedCells = blockedCells;
        if (blockedMode) {
            updatedBlockedCells = [...blockedCells, { row: piece.row, col: piece.col }];
            stateManager.setState('game.blockedCells', updatedBlockedCells);
            console.log('[DIAG] blockedCells після executeMove:', updatedBlockedCells);
        }
        
        console.log('[GameLogic] New board size after move:', newBoard.length);
        
        // Оновлюємо масив дошки окремо для реактивності
        stateManager.setState('game.board', JSON.parse(JSON.stringify(newBoard)));
        // Оновлюємо решту стану гри (без дублювання дошки)
        const newPoints = gameState.points + (move.points || 0);
        
        // Перевіряємо, чи є ще ходи для piece 1 з урахуванням заблокованих клітинок
        const hasMoreMoves = hasValidMoves(newBoard, move.newRow, move.newCol, logicPlayer, updatedBlockedCells, blockedMode);
        if (!hasMoreMoves) {
            // Гра закінчена - визначаємо переможця
            const winner = logicPlayer === 1 ? 2 : 1;
            this.endGame(winner);
        }
        stateManager.setState('game.points', newPoints);
        // Додаємо хід в історію
        stateManager.addMoveToHistory({
            from: { row: piece.row, col: piece.col },
            to: { row: move.newRow, col: move.newCol },
            direction: move.direction,
            distance: move.distance,
            points: move.points || 0
        });
        // Оновлюємо доступні ходи
        console.log('[GameLogic] Updating available moves after move execution');
        this.updateAvailableMoves();
        // Показуємо повідомлення
        this.showGameMessage();
        console.log('[GameLogic] After move execution - currentPlayer:', stateManager.getState('game.currentPlayer'));
        // Мовна підтримка
        if (this.speechEnabled) {
            this.speakMove(move);
        }
        this.log('Move executed', { move, newPoints });
        console.log('[GameLogic] Move execution completed');
    }
    
    // Перемикання гравця
    switchPlayer() {
        console.log('[GameLogic] switchPlayer called');
        const gameState = stateManager.getState('game');
        const currentPlayer = gameState.currentPlayer;
        const gameMode = gameState.gameMode;
        
        if (gameMode === 'vsComputer' && currentPlayer === 1) {
            // Хід комп'ютера
            this.makeComputerMove();
        } else if (gameMode === 'vsComputer' && currentPlayer === 2) {
            // Після ходу комп'ютера повертаємо чергу гравцю
            stateManager.setState('game.currentPlayer', 1);
        } else {
            // Для локальної гри — стандартна зміна гравця
            const nextPlayer = currentPlayer === 1 ? 2 : 1;
            stateManager.setState('game.currentPlayer', nextPlayer);
        }
    }
    
    // Хід комп'ютера
    makeComputerMove() {
        console.log('[GameLogic] makeComputerMove called');
        const gameState = stateManager.getState('game');
        const board = gameState.board;
        
        // Знаходимо фігуру на дошці (в грі з комп'ютером є тільки одна фігура)
        const piece = findPiece(board, 1);
        if (!piece) {
            console.log('[GameLogic] No piece found on board');
            return;
        }
        
        console.log('[GameLogic] Found piece at:', piece.row, piece.col);
        
        // Отримуємо всі доступні ходи для комп'ютера (має бути player 1, бо фігура одна)
        console.log('[GameLogic] Board state size:', board.length);
        // Отримуємо заблоковані клітинки та режим
        const blockedCells = gameState.blockedCells || [];
        const blockedMode = stateManager.getState('settings.blockedMode') || false;
        
        console.log('[GameLogic] Looking for moves from position:', piece.row, piece.col, 'for player 1');
        const moves = getAllValidMoves(board, piece.row, piece.col, 1, blockedCells, blockedMode); // <-- FIXED: was 2
        console.log('[GameLogic] Available moves for computer count:', moves.length, 'blockedMode:', blockedMode, 'blockedCells:', blockedCells.length);
        
        Logger.debug('[GameLogic] makeComputerMove - blocked cells analysis:', { 
            blockedMode, 
            blockedCellsCount: blockedCells.length, 
            blockedCells,
            availableMovesCount: moves.length 
        });
        
        if (moves.length === 0) {
            console.log('[GameLogic] No moves available for computer, player wins');
            this.endGame(1); // Гравець перемагає
            return;
        }
        
        // Вибираємо випадковий хід
        const bestMove = this.selectBestMove(moves);
        console.log('[GameLogic] Selected best move:', bestMove);
        
        if (!bestMove) {
            console.log('[GameLogic] No move selected, ending game');
            this.endGame(1); // Гравець перемагає
            return;
        }
        
        // Виконуємо хід
        console.log('[GameLogic] Executing computer move:', bestMove);
        this.executeMove(bestMove);
        
        // Показуємо хід комп'ютера в центрі керування
        if (window.gameControlsComponent && typeof window.gameControlsComponent.showComputerMove === 'function') {
            window.gameControlsComponent.showComputerMove(bestMove.direction, bestMove.distance);
        }
        
        // Після ходу комп'ютера повертаємо чергу гравцю
        stateManager.setState('game.currentPlayer', 1);
        console.log('[GameLogic] Computer move completed, returning turn to player');
        console.log('[GameLogic] Current player after computer move:', stateManager.getState('game.currentPlayer'));
    }
    
    // Вибір випадкового ходу для комп'ютера
    selectBestMove(moves) {
        console.log('[GameLogic] selectBestMove called with moves count:', moves.length);
        
        if (moves.length === 0) {
            console.log('[GameLogic] No moves available');
            return null;
        }
        
        // Покращений випадковий алгоритм з додатковим перемішуванням
        // Спочатку перемішуємо масив ходів для кращої випадковості
        const shuffledMoves = [...moves].sort(() => Math.random() - 0.5);
        console.log('[GameLogic] Shuffled moves count:', shuffledMoves.length);
        
        // Вибираємо випадковий хід з перемішаного масиву
        const randomIndex = Math.floor(Math.random() * shuffledMoves.length);
        const selectedMove = shuffledMoves[randomIndex];
        
        console.log('[GameLogic] Random index:', randomIndex, 'Selected move:', selectedMove);
        return selectedMove;
    }
    
    // Перевірка відсутності ходів
    checkNoMoves() {
        console.log('[GameLogic] checkNoMoves called');
        const gameState = stateManager.getState('game');
        const currentPlayer = gameState.currentPlayer;
        const board = gameState.board;
        const gameMode = gameState.gameMode;
        
        // Знаходимо фігуру на дошці
        let piece;
        if (gameMode === 'vsComputer') {
            // В грі з комп'ютером на дошці завжди є тільки одна фігура (player 1)
            piece = findPiece(board, 1);
        } else {
            // В локальній грі шукаємо фігуру поточного гравця
            piece = findPiece(board, currentPlayer);
        }
        
        if (!piece) return;
        
        // Отримуємо заблоковані клітинки та режим
        const blockedCells = gameState.blockedCells || [];
        const blockedMode = stateManager.getState('settings.blockedMode') || false;
        
        // Перевіряємо, чи є доступні ходи з урахуванням заблокованих клітинок
        const hasMoves = hasValidMoves(board, piece.row, piece.col, currentPlayer, blockedCells, blockedMode);
        
        if (!hasMoves) {
            // Гравець не може зробити хід
            this.endGame(currentPlayer === 1 ? 2 : 1);
        } else {
            this.showError('У вас є доступні ходи');
        }
        
        // Скидаємо прапорець
        stateManager.setState('game.noMoves', false);
    }
    
    // Закінчення гри
    endGame(winner) {
        console.log('[GameLogic] endGame called with winner:', winner);
        const gameState = stateManager.getState('game');
        const player1Name = (gameState.playerNames && gameState.playerNames.p1) ? gameState.playerNames.p1 : 'Гравець 1';
        const player2Name = (gameState.playerNames && gameState.playerNames.p2) ? gameState.playerNames.p2 : 'Гравець 2';
        const finalPoints = gameState.points;
        
        // Визначаємо переможця
        const winnerName = winner === 1 ? player1Name : player2Name;
        
        // Показуємо повідомлення про закінчення гри
        const message = `Гра закінчена! Переможець: ${winnerName}. Фінальні очки: ${finalPoints}`;
        
        stateManager.showModal('Кінець гри', message, [
            { 
                text: 'Головне меню', 
                onClick: () => stateManager.navigateTo('mainMenu') 
            }
        ]);
        
        // Зупиняємо гру
        stateManager.setState('game.isActive', false);
        
        // Мовна підтримка
        if (this.speechEnabled) {
            speakGameMessage(`Гра закінчена. Переможець: ${winnerName}`);
        }
        
        this.log('Game ended', { winner, finalPoints });
    }
    
    // Показ повідомлення гри
    showGameMessage() {
        console.log('[GameLogic] showGameMessage called');
        const gameState = stateManager.getState('game');
        const currentPlayer = gameState.currentPlayer;
        const gameMode = gameState.gameMode;
        const player1Name = (gameState.playerNames && gameState.playerNames.p1) ? gameState.playerNames.p1 : 'Гравець 1';
        const player2Name = (gameState.playerNames && gameState.playerNames.p2) ? gameState.playerNames.p2 : 'Гравець 2';
        
        let message = '';
        
        if (gameMode === 'vsComputer') {
            if (currentPlayer === 1) {
                message = 'Ваш хід';
            } else {
                message = 'Хід комп\'ютера';
            }
        } else {
            const currentPlayerName = currentPlayer === 1 ? player1Name : player2Name;
            message = `Хід гравця: ${currentPlayerName}`;
        }
        
        console.log('[GameLogic] showGameMessage - currentPlayer:', currentPlayer, 'gameMode:', gameMode, 'message:', message);
        
        // Оновлюємо повідомлення в UI
        const messageArea = document.getElementById('message-area');
        if (messageArea) {
            messageArea.textContent = message;
            console.log('[GameLogic] Message updated in UI:', message);
        } else {
            console.log('[GameLogic] Message area not found');
        }
    }
    
    // Показ помилки
    showError(message) {
        console.log('[GameLogic] showError:', message);
        stateManager.showModal('Помилка', message, [{ text: 'OK', class: 'primary' }]);
    }
    
    // Мовна підтримка для ходів
    speakMove(move) {
        console.log('[GameLogic] speakMove called with:', move);
        const directionText = getDirectionText(move.direction);
        const message = `Хід ${directionText} на відстань ${move.distance}`;
        speakMove(message);
    }
    
    // Ініціалізація компонентів
    initComponents() {
        console.log('[GameLogic] initComponents called');
        // Цей метод буде викликатися, коли компоненти будуть готові
        // Поки що залишаємо порожнім
    }
    
    // Логування
    log(message, data = {}) {
        console.log(`[GameLogic] ${message}`, data);
    }
    
    // Очищення ресурсів
    destroy() {
        console.log('[GameLogic] Destroying...');
        this.log('Destroying Game Logic');
        
        // Зупиняємо мову
        if (this.speechEnabled) {
            stopSpeaking();
        }
        
        this.isInitialized = false;
        console.log('[GameLogic] Destroyed');
    }
}

// Експортуємо єдиний екземпляр
export const gameLogic = new GameLogic(); 