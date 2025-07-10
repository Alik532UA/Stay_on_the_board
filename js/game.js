// === МОВНА ПІДТРИМКА ===
import {
    findPiece, hasValidMoves, getAllValidMoves, getDirectionDelta, getDirectionText, getDirectionArrow
} from './game-core.js';
import {
    showModal, hideModal, renderBoard, toggleBoardVisibility, generateDistanceButtons,
    handleDirectionSelect, handleDistanceSelect, resetSelections, showMainMenu, showOnlineGameMenu,
    showRules, showControlsInfo, showBoardSizeSelection, initStyle, changeStyle, initTheme,
    toggleTheme, initOnlineUsers, showPlayerNameInput
} from './ui.js';
import { t, loadLanguage, updateUIWithLanguage } from './localization.js';

document.addEventListener('DOMContentLoaded', () => {
    function loadLanguage(lang) {
        window.translations = window.translationsAll[lang];
        currentLang = lang;
        localStorage.setItem('lang', lang);
        updateUIWithLanguage();
    }

    function updateUIWithLanguage() {
        // Оновлюємо головне меню, якщо воно відкрите
        if (!modalOverlay.classList.contains('hidden')) {
            openMainMenu();
        }
        // Оновлюємо підписи поза модалкою
        messageAreaEl.textContent = t('mainMenu.welcome');
        playerTurnIndicatorEl.textContent = t('mainMenu.playerTurn') || '';
        opponentNameEl.textContent = t('mainMenu.opponent') || '';
        // Можна додати інші елементи, якщо потрібно
    }

    // --- Глобальні змінні та посилання на DOM-елементи ---
    let board = [];
    let blockedCells = []; // Масив для відстеження заблокованих клітинок
    let numberCells = 0;
    let points = 0;
    let isPlayerTurn = false;
    let selectedDirection = null;
    let selectedDistance = null;
    let blockedMode = false; // Режим заблокованих клітинок
    let isOnlineGame = false; // Чи це онлайн гра
    let isHost = false; // Чи є хостом кімнати
    let roomId = null; // ID кімнати
    let peerConnection = null; // WebRTC з\'єднання
    let dataChannel = null; // Канал для обміну даними
    let isConnected = false; // Чи підключені гравці
    let waitingForOpponent = false; // Очікування суперника
    let signalingSocket = null; // WebSocket для signaling
    const version = "0.1.2";

    let currentGameMode = 'vsComputer'; // 'vsComputer' або 'localTwoPlayer'
    let currentPlayer = 1; // 1 або 2 для режиму localTwoPlayer
    let player1Name = 'Гравець 1';
    let player2Name = 'Гравець 2';

    let firstMoveDone = false;

    // Безкоштовний signaling сервер
    const SIGNALING_SERVER = 'wss://signaling-server-1.glitch.me';

    const gameBoardEl = document.getElementById('game-board');
    const scoreDisplayEl = document.getElementById('score-display');
    const messageAreaEl = document.getElementById('message-area');
    const showBoardCheckbox = document.getElementById('show-board-checkbox');
    const blockedModeCheckbox = document.getElementById('blocked-mode-checkbox');
    
    const visualControlsEl = document.getElementById('visual-controls');
    const directionGridEl = document.getElementById('direction-grid');
    const distanceSelectorEl = document.getElementById('distance-selector');
    const confirmMoveBtn = document.getElementById('confirm-move-btn');
    const noMovesBtn = document.getElementById('no-moves-btn');
    const styleSelect = document.getElementById('style-select');
    const computerMoveDisplayEl = document.getElementById('computer-move-display');
    const onlineCountEl = document.getElementById('online-count');
    const showMovesCheckbox = document.getElementById('show-moves-checkbox');
    const player1Glow = document.getElementById('player1-glow');
    const player2Glow = document.getElementById('player2-glow');

    function updateComputerMoveDisplay({direction, distance, isComputer, isPlayer}) {
        const el = computerMoveDisplayEl;
        if (!el) return;
        let html = '';

        // Видаляємо всі класи кольорів
        el.classList.remove('player1-turn', 'player2-turn', 'computer-turn');

        // Встановлюємо клас відповідно до поточного гравця
        if (isComputer) {
            // Якщо це хід комп'ютера, встановлюємо червоний колір
            el.classList.add('computer-turn');
        } else if (isPlayerTurn) {
            if (currentGameMode === 'localTwoPlayer') {
                el.classList.add(currentPlayer === 1 ? 'player1-turn' : 'player2-turn');
            } else {
                el.classList.add('player1-turn'); // Default player color
            }
        } else if (currentGameMode === 'vsComputer' && !isPlayerTurn) {
            el.classList.add('computer-turn');
        }

        el.classList.remove('confirm-btn-active');
        el.onclick = null;
        if (isComputer || isPlayer) {
            if (direction && distance) {
                html = `<span style="font-size: 1em; font-weight: bold;">${getDirectionArrow(direction)} ${distance}</span>`;
                if (isPlayer) {
                    el.classList.add('confirm-btn-active');
                    el.onclick = () => {
                        if (selectedDirection && selectedDistance) {
                            confirmMoveBtn.click();
                        }
                    };
                }
            } else if (direction) {
                html = `<span style="font-size: 2em; font-weight: bold;">${getDirectionArrow(direction)}</span>`;
            } else if (distance) {
                html = `<span style="font-size: 2em; font-weight: bold;">${distance}</span>`;
            }
        }
        el.innerHTML = html;
    }

    // Елементи для онлайн гри
    const onlineGamePanelEl = document.getElementById('online-game-panel');
    const connectionIndicatorEl = document.getElementById('connection-indicator');
    const connectionTextEl = document.getElementById('connection-text');
    const webrtcSignalingAreaEl = document.getElementById('webrtc-signaling-area');
    const webrtcInstructionsEl = document.getElementById('webrtc-instructions');
    const webrtcDataOutputEl = document.getElementById('webrtc-data-output');
    const webrtcDataInputEl = document.getElementById('webrtc-data-input');
    const webrtcConfirmBtn = document.getElementById('webrtc-confirm-btn');
    const playerTurnIndicatorEl = document.getElementById('player-turn-indicator');
    const opponentNameEl = document.getElementById('opponent-name');

    const modalOverlay = document.getElementById('modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const modalFooter = document.getElementsByClassName('modal-footer')[0];
    const themeToggle = document.getElementById('theme-toggle');
    const lightThemeBtn = document.getElementById('light-theme-btn');
    const darkThemeBtn = document.getElementById('dark-theme-btn');

    // --- Нові топ-контроли ---
    const themeStyleBtn = document.getElementById('theme-style-btn');
    const themeStyleDropdown = document.getElementById('theme-style-dropdown');
    const styleOptionsList = document.getElementById('style-options');
    const styleOptions = styleOptionsList ? styleOptionsList.querySelectorAll('.style-option') : [];
    const langBtn = document.getElementById('lang-btn');
    const langDropdown = document.getElementById('lang-dropdown');
    const langFlag = document.getElementById('lang-flag');
    const langOptions = document.querySelectorAll('.lang-option');
    const flagMap = { uk: 'flag-uk', en: 'flag-en', crh: 'flag-crh' };

    // Відкрити/закрити дропдауни
    if (themeStyleBtn && themeStyleDropdown) {
        themeStyleBtn.addEventListener('click', (e) => {
            themeStyleDropdown.classList.toggle('hidden');
            langDropdown.classList.add('hidden');
            e.stopPropagation();
        });
    }
    if (langBtn && langDropdown) {
        langBtn.addEventListener('click', (e) => {
            langDropdown.classList.toggle('hidden');
            themeStyleDropdown.classList.add('hidden');
            e.stopPropagation();
        });
    }
    document.addEventListener('click', (e) => {
        if (!themeStyleDropdown.contains(e.target) && e.target !== themeStyleBtn) themeStyleDropdown.classList.add('hidden');
        if (!langDropdown.contains(e.target) && e.target !== langBtn) langDropdown.classList.add('hidden');
    });

    // Тема
    function updateThemeButtons() {
        document.getElementById('theme-style-icon').textContent = '🌗';
        updateThemeStyleDropdownActive();
    }
    if (lightThemeBtn && darkThemeBtn) {
        lightThemeBtn.addEventListener('click', () => {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
            updateThemeButtons();
        });
        darkThemeBtn.addEventListener('click', () => {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            updateThemeButtons();
        });
        updateThemeButtons();
    }

    // Стиль
    const styleNames = {
        classic: { uk: 'Ubuntu', en: 'Ubuntu', crh: 'Ubuntu' },
        peak: { uk: 'PEAK', en: 'PEAK', crh: 'PEAK' },
        cs2: { uk: 'CS 2', en: 'CS 2', crh: 'CS 2' },
        glass: { uk: 'Glassmorphism', en: 'Glassmorphism', crh: 'Glassmorphism' },
        material: { uk: 'Material You', en: 'Material You', crh: 'Material You' }
    };
    function updateStyleDropdownLang() {
        const lang = localStorage.getItem('lang') || 'uk';
        styleOptions.forEach(opt => {
            const style = opt.getAttribute('data-style');
            if (styleNames[style]) opt.textContent = styleNames[style][lang];
        });
        updateThemeStyleDropdownActive();
    }
    if (styleOptionsList) {
        styleOptions.forEach(opt => {
            opt.addEventListener('click', () => {
                const style = opt.getAttribute('data-style');
                localStorage.setItem('style', style);
                document.documentElement.setAttribute('data-style', style);
                themeStyleDropdown.classList.add('hidden');
            });
        });
        updateStyleDropdownLang();
    }
    // Оновлювати підписи стилів при зміні мови
    if (langBtn) {
        langBtn.addEventListener('click', updateStyleDropdownLang);
    }

    // Мова
    function updateLangFlag() {
        const lang = localStorage.getItem('lang') || 'uk';
        langFlag.className = 'flag ' + (flagMap[lang] || 'flag-uk');
        langOptions.forEach(opt => {
            opt.classList.toggle('selected', opt.getAttribute('data-lang') === lang);
        });
    }
    langOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            const lang = opt.getAttribute('data-lang');
            localStorage.setItem('lang', lang);
            alert('Зміни мови застосуються після перезавантаження сторінки.\nLanguage changes will apply after page reload.\nTilni deñiştirmek içün saifeni qayta yükleñiz.');
            updateLangFlag();
            langDropdown.classList.add('hidden');
            // loadLanguage(lang); // якщо потрібно одразу застосовувати
        });
    });
    updateLangFlag();

    // --- Дропдаун тема+стиль (нова логіка) ---
    const themeStyleRows = document.querySelectorAll('.theme-style-row');
    function updateThemeStyleDropdownActive() {
        const currentStyle = localStorage.getItem('style') || 'classic';
        const currentTheme = localStorage.getItem('theme') || 'light';
        themeStyleRows.forEach(row => {
            const style = row.getAttribute('data-style');
            row.querySelectorAll('.theme-btn').forEach(btn => {
                const btnTheme = btn.getAttribute('data-theme');
                btn.classList.toggle('active', style === currentStyle && btnTheme === currentTheme);
            });
        });
    }
    themeStyleRows.forEach(row => {
        const style = row.getAttribute('data-style');
        row.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const theme = btn.getAttribute('data-theme');
                localStorage.setItem('style', style);
                localStorage.setItem('theme', theme);
                document.documentElement.setAttribute('data-style', style);
                document.documentElement.setAttribute('data-theme', theme);
                updateThemeButtons();
                updateThemeStyleDropdownActive();
                themeStyleDropdown.classList.add('hidden');
            });
        });
    });
    updateThemeStyleDropdownActive();

    // --- Основні функції гри ---

    function renderBoard() {
        gameBoardEl.innerHTML = '';
        gameBoardEl.style.gridTemplateColumns = `repeat(${numberCells}, 1fr)`;
        for (let i = 0; i < numberCells; i++) {
            for (let j = 0; j < numberCells; j++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                if ((i + j) % 2 === 0) {
                    cell.classList.add('cell-light');
                } else {
                    cell.classList.add('cell-dark');
                }
                
                // Перевіряємо чи клітинка заблокована
                if (blockedMode && blockedCells.some(pos => pos.row === i && pos.col === j)) {
                    cell.classList.add('cell-blocked');
                }
                
                // Перевіряємо чи клітинка доступна для ходу
                if (window.showingAvailableMoves && window.availableMoves) {
                    if (window.availableMoves.some(move => move.newRow === i && move.newCol === j)) {
                        cell.classList.add('cell-available');
                    }
                }
                
                if (board[i][j] === 1) {
                    cell.classList.add('piece');
                    cell.textContent = '♛';
                }
                gameBoardEl.appendChild(cell);
            }
        }
        scoreDisplayEl.textContent = points;
    }

    function updatePlayerGlow() {
        if (currentGameMode !== 'localTwoPlayer' || !isPlayerTurn) {
            player1Glow.classList.remove('visible');
            player2Glow.classList.remove('visible');
            return;
        }

        player1Glow.classList.toggle('visible', currentPlayer === 1);
        player2Glow.classList.toggle('visible', currentPlayer === 2);
    }

    function startGame(size, gameMode = 'vsComputer') {
        currentGameMode = gameMode;
        numberCells = size;
        points = 0;
        isPlayerTurn = true;
        blockedMode = blockedModeCheckbox.checked;
        board = Array(numberCells).fill(0).map(() => Array(numberCells).fill(0));
        blockedCells = []; // Очищаємо заблоковані клітинки
        
        // Очищаємо візуалізацію доступних ходів
        window.showingAvailableMoves = false;
        window.availableMoves = null;
        
        const startRow = Math.floor(Math.random() * numberCells);
        const startCol = Math.floor(Math.random() * numberCells);
        board[startRow][startCol] = 1;
        console.log('[startGame] board after placing piece:', board);
        
        // При старті гри дошка завжди показана:
        showBoardCheckbox.checked = true;
        gameBoardEl.classList.remove('board-hidden');
        renderBoard();
        generateDistanceButtons();
        resetSelections(true);
        hideModal();
        
        const modeText = blockedMode ? " (режим заблокованих клітинок)" : "";
        if (currentGameMode === 'localTwoPlayer') {
            currentPlayer = 1;
            messageAreaEl.textContent = `Хід гравця ${player1Name}: оберіть напрямок та відстань.${modeText}`;
        } else {
            messageAreaEl.textContent = `Ваш хід: оберіть напрямок та відстань.${modeText}`;
        }
        visualControlsEl.classList.remove('hidden');
        updateComputerMoveDisplay({});
        firstMoveDone = false;
        updatePlayerGlow();
    }

    function processPlayerMove() {
        console.log('[processPlayerMove] called', { isPlayerTurn, selectedDirection, selectedDistance });
        if (!isPlayerTurn) {
            console.log('[processPlayerMove] Not player turn');
            return;
        }
        if (!selectedDirection || !selectedDistance) {
            console.log('[processPlayerMove] Direction or distance not selected', { selectedDirection, selectedDistance });
            messageAreaEl.textContent = "Будь ласка, оберіть напрямок ТА відстань!";
            return;
        }
        const piecePos = findPiece(board, numberCells);
        console.log('[processPlayerMove] piecePos', piecePos);
        if (!piecePos) {
            console.log('[processPlayerMove] No piece found');
            return;
        }
        const { row, col } = piecePos;
        const { dr, dc } = getDirectionDelta(selectedDirection);
        const newRow = row + dr * selectedDistance;
        const newCol = col + dc * selectedDistance;
        console.log('[processPlayerMove] Calculated new position', { newRow, newCol });
        // Перевіряємо чи нова позиція в межах дошки
        if (newRow >= 0 && newRow < numberCells && newCol >= 0 && newCol < numberCells) {
            // Перевіряємо чи клітинка заблокована (в режимі заблокованих клітинок)
            if (blockedMode && blockedCells.some(pos => pos.row === newRow && pos.col === newCol)) {
                const directionText = getDirectionText(selectedDirection);
                const reason = `Ви спробували перемістити фігуру на заблоковану клітинку ${directionText}. Гра закінчена!`;
                console.log('[processPlayerMove] Blocked cell move, ending game', { newRow, newCol });
                if (isOnlineGame) {
                    if (typeof endOnlineGame === 'function') {
                        endOnlineGame(reason);
                    } else {
                        endGame(reason, false);
                    }
                } else {
                    endGame(reason, false);
                }
                return;
            }
            // Блокуємо поточну клітинку якщо увімкнено режим
            if (blockedMode) {
                blockedCells.push({ row, col });
                console.log('[processPlayerMove] Blocked current cell', { row, col });
            }
            
            // Очищаємо візуалізацію доступних ходів
            window.showingAvailableMoves = false;
            window.availableMoves = null;
            
            board[row][col] = 0;
            board[newRow][newCol] = 1;
            points++;
            renderBoard();
            isPlayerTurn = false;
            messageAreaEl.textContent = "";
            resetSelections();
            generateDistanceButtons();
            resetSelections(true);
            updateComputerMoveDisplay({}); // Очищаємо центр після ходу гравця
            console.log('[processPlayerMove] Move completed', { row, col, newRow, newCol, points });
            if (isOnlineGame) {
                playerTurnIndicatorEl.textContent = 'Хід суперника';
                
                // Надсилаємо хід супернику
                const move = {
                    direction: selectedDirection,
                    distance: selectedDistance
                };
                if (typeof sendMoveToOpponent === 'function') {
                    sendMoveToOpponent(move);
                }
            } else if (currentGameMode === 'vsComputer') {
                setTimeout(computerMove, 1000);
            } else if (currentGameMode === 'localTwoPlayer') {
                currentPlayer = (currentPlayer === 1) ? 2 : 1;
                const nextPlayerName = (currentPlayer === 1) ? player1Name : player2Name;
                isPlayerTurn = true;
                messageAreaEl.textContent = `Хід гравця ${nextPlayerName}. Оберіть напрямок та відстань.`;
                // Оновлюємо колір фону для нового гравця
                updateComputerMoveDisplay({});
                // Оновлюємо доступні ходи для наступного гравця, якщо чекбокс увімкнено
                if (showMovesCheckbox && showMovesCheckbox.checked) {
                    window.availableMoves = null;
                    window.showingAvailableMoves = false;
                    showAvailableMoves();
                }
            }
            updatePlayerGlow();
            // Після всіх змін — якщо чекбокс увімкнено, показати доступні ходи для наступного ходу
            if (showMovesCheckbox && showMovesCheckbox.checked) {
                showAvailableMoves();
            }
        } else {
            const directionText = getDirectionText(selectedDirection);
            const reason = `Ви спробували перемістити фігуру на ${selectedDistance} клітин(ку) ${directionText} і вийшли за межі дошки.`;
            console.log('[processPlayerMove] Out of bounds', { newRow, newCol });
            if (isOnlineGame) {
                endOnlineGame(reason);
            } else {
                endGame(reason, false);
            }
        }
        if (!firstMoveDone) {
            showBoardCheckbox.checked = false;
            toggleBoardVisibility();
            firstMoveDone = true;
        }
    }

    function checkNoMoves() {
        if (!isPlayerTurn) return;
        
        if (hasValidMoves(board, blockedCells, blockedMode, numberCells)) {
            const reason = "Ви заявили про відсутність ходів, але у вас є можливі ходи. Гра закінчена!";
            if (isOnlineGame) {
                endOnlineGame(reason);
            } else {
                endGame(reason, false);
            }
        } else {
            const reason = "Ви правильно визначили відсутність ходів. Ви перемогли!";
            if (isOnlineGame) {
                // Надсилаємо повідомлення супернику
                if (dataChannel && dataChannel.readyState === 'open') {
                    const message = {
                        type: 'noMoves'
                    };
                    dataChannel.send(JSON.stringify(message));
                }
                endOnlineGame(reason);
            } else {
                endGame(reason, true); // true означає, що гравець переміг
            }
        }
    }

    function showAvailableMoves() {
        if (!isPlayerTurn) return;
        
        window.availableMoves = null;
        window.showingAvailableMoves = false;
        const validMoves = getAllValidMoves(board, blockedCells, blockedMode, numberCells);
        if (validMoves.length === 0) {
            messageAreaEl.textContent = "Немає доступних ходів!";
            return;
        }
        
        window.availableMoves = validMoves;
        window.showingAvailableMoves = true;
        renderBoard();
        
        let movesText = "Доступні ходи:\n";
        validMoves.forEach((move, index) => {
            movesText += `${index + 1}. ${move.directionText} на ${move.distance} клітинку\n`;
        });
        
        // messageAreaEl.textContent = movesText; // Не показуємо доступні ходи у message-area
        
        // Не приховуємо доступні ходи автоматично, вони залишаються поки увімкнено чекбокс
    }

    function computerMove() {
        if (isPlayerTurn) return;
        
        const validMoves = getAllValidMoves(board, blockedCells, blockedMode, numberCells);
        if (validMoves.length === 0) {
            endGame("Комп'ютер не може зробити хід. Ви перемогли!");
            return;
        }
        
        const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
        const piecePos = findPiece(board, numberCells);
        if (!piecePos) return;
        
        const { row, col } = piecePos;
        const { dr, dc } = getDirectionDelta(randomMove.direction);
        const newRow = row + dr * randomMove.distance;
        const newCol = col + dc * randomMove.distance;
        
        // Блокуємо поточну клітинку якщо увімкнено режим
        if (blockedMode) {
            blockedCells.push({ row, col });
        }
        
        board[row][col] = 0;
        board[newRow][newCol] = 1;
        
        renderBoard();
        generateDistanceButtons();
        resetSelections(true);
        
        const directionText = getDirectionText(randomMove.direction);
        messageAreaEl.textContent = `Комп'ютер зробив хід: ${directionText} на ${randomMove.distance} клітинку.`;
        updateComputerMoveDisplay({direction: randomMove.direction, distance: randomMove.distance, isComputer: true});
        
        // Оновлюємо доступні ходи для гравця, якщо чекбокс увімкнено
        if (showMovesCheckbox && showMovesCheckbox.checked) {
            window.availableMoves = null;
            window.showingAvailableMoves = false;
            showAvailableMoves();
        } else {
            window.showingAvailableMoves = false;
            window.availableMoves = null;
        }
        isPlayerTurn = true;
        // Видалено оновлення колір фону - хід комп'ютера залишається видимим
        // Після всіх змін — якщо чекбокс увімкнено, показати доступні ходи для гравця
        if (showMovesCheckbox && showMovesCheckbox.checked) {
            showAvailableMoves();
        }
        // setTimeout видалено, центр не очищається автоматично
    }

    function endGame(reason, isWin = false) {
        isPlayerTurn = false;
        visualControlsEl.classList.add('hidden');

        let title = isWin ? "Перемога!" : "Гра закінчена!";
        let finalReason = reason;

        if (currentGameMode === 'localTwoPlayer' && !isWin) {
            const loserName = (currentPlayer === 1) ? player1Name : player2Name;
            finalReason = `Гравець ${loserName} програв. ${reason}`;
        }
        updatePlayerGlow();
        updateComputerMoveDisplay({}); // Скидаємо колір фону

        showModal(
            title,
            `<p>${finalReason}</p><p><strong>Кількість набраних очок: ${points}</strong></p><p>Версія гри: ${version}</p>`,
            [
                { text: "Вибрати розмір дошки", class: "primary", onClick: () => openBoardSizeSelection(currentGameMode) },
                { text: "Меню", onClick: openMainMenu }
            ]
        );
    }

    function toggleBoardVisibility() {
        const showMovesWrapper = document.getElementById('show-moves-checkbox-wrapper');
        if (!showBoardCheckbox.checked) {
            gameBoardEl.classList.add('board-hidden');
            if (showMovesWrapper) showMovesWrapper.style.display = 'none';
        } else {
            gameBoardEl.classList.remove('board-hidden');
            if (showMovesWrapper) showMovesWrapper.style.display = '';
        }
    }

    function generateDistanceButtons() {
        distanceSelectorEl.innerHTML = '';
        for (let i = 1; i < numberCells; i++) {
            const button = document.createElement('button');
            button.classList.add('distance-btn');
            button.textContent = i;
            button.dataset.distance = i;
            distanceSelectorEl.appendChild(button);
        }
        // Вибираємо першу кнопку (відстань 1) за замовчуванням, але не показуємо в центрі
        const firstBtn = distanceSelectorEl.querySelector('.distance-btn');
        if (firstBtn) {
            firstBtn.classList.add('selected');
            selectedDistance = 1;
            // Видалено автоматичний показ вибору гравця - хід комп'ютера залишається видимим
        }
    }

    function handleDirectionSelect(e) {
        if (e.target.classList.contains('control-btn')) {
            const newDirection = parseInt(e.target.dataset.direction);
            if (selectedDirection === newDirection) {
                // Якщо натиснуто ту ж стрілку — збільшуємо відстань
                selectedDistance = (selectedDistance % (numberCells - 1)) + 1;
                // Підсвічуємо відповідну кнопку відстані
                document.querySelectorAll('.distance-btn').forEach(btn => {
                    btn.classList.toggle('selected', parseInt(btn.dataset.distance) === selectedDistance);
                });
            } else {
                // Звичайна логіка вибору напрямку
                document.querySelectorAll('.control-btn').forEach(btn => btn.classList.remove('selected'));
                e.target.classList.add('selected');
                selectedDirection = newDirection;
            }
            // updateComputerMoveDisplay({}); // Видалено очищення центру
            updateComputerMoveDisplay({direction: selectedDirection, distance: selectedDistance, isPlayer: true});
        }
    }

    function handleDistanceSelect(e) {
        if (e.target.classList.contains('distance-btn')) {
            document.querySelectorAll('.distance-btn').forEach(btn => btn.classList.remove('selected'));
            e.target.classList.add('selected');
            selectedDistance = parseInt(e.target.dataset.distance);
            // updateComputerMoveDisplay({}); // Видалено очищення центру
            updateComputerMoveDisplay({direction: selectedDirection, distance: selectedDistance, isPlayer: true});
        }
    }

    function resetSelections(skipDistanceReset) {
        selectedDirection = null;
        if (!skipDistanceReset) selectedDistance = null;
        document.querySelectorAll('.control-btn, .distance-btn').forEach(btn => btn.classList.remove('selected'));
        updateComputerMoveDisplay({});
    }

    function showModal(title, bodyHTML, buttons = []) {
        modalTitle.textContent = title;
        modalBody.innerHTML = bodyHTML;
        
        modalFooter.innerHTML = '';
        buttons.forEach(button => {
            const btn = document.createElement('button');
            btn.textContent = button.text;
            btn.className = `modal-button ${button.class || ''}`;
            btn.onclick = button.onClick;
            modalFooter.appendChild(btn);
        });
        
        modalOverlay.classList.remove('hidden');
    }

    function hideModal() {
        modalOverlay.classList.add('hidden');
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) gameContainer.style.display = '';
        if (typeof window.hideMainMenu === 'function') window.hideMainMenu();
    }

    // --- Замість локальних функцій меню, використовуємо імпортовані ---
    // showMainMenu, showOnlineGameMenu, showRules, showControlsInfo, showBoardSizeSelection
    // Передаємо потрібні функції як аргументи, якщо треба
    // Приклад виклику:
    // showMainMenu(showModal, t, () => showRules(showModal, t, showMainMenu), ...)

    // --- Меню-функції з замиканнями для коректної навігації ---
    function openMainMenu() {
        showMainMenu(
            showModal,
            t,
            openRules,
            openControlsInfo,
            () => openBoardSizeSelection('vsComputer'),
            () => openBoardSizeSelection('localTwoPlayer'),
            openOnlineGameMenu,
            () => { /* Логіка для донату, якщо потрібна */ }
        );
    }
    function openBoardSizeSelection(gameMode = 'vsComputer') {
        if (gameMode === 'localTwoPlayer') {
            // Спочатку вибір розміру, потім імена
            showBoardSizeSelection(
                showModal,
                t,
                (size) => openPlayerNameInput(size, gameMode), // callback, що викликає ввід імен
                openMainMenu
            );
        } else {
            showBoardSizeSelection(
                showModal,
                t,
                (size) => startGame(size, gameMode), // callback, що одразу стартує гру
                openMainMenu
            );
        }
    }

    function openPlayerNameInput(size, gameMode) {
        showPlayerNameInput(showModal, t, (p1Name, p2Name) => {
            player1Name = p1Name;
            player2Name = p2Name;
            startGame(size, gameMode);
        });
    }

    function openRules() {
        showRules(showModal, t, openMainMenu);
    }
    function openControlsInfo() {
        showControlsInfo(showModal, t, openMainMenu);
    }
    function openOnlineGameMenu() {
        showOnlineGameMenu(showModal, t, hideModal, createRoom, joinRoom, openMainMenu);
    }

    // --- Ініціалізація гри та слухачі подій ---
    directionGridEl.addEventListener('click', handleDirectionSelect);
    distanceSelectorEl.addEventListener('click', handleDistanceSelect);
    confirmMoveBtn.addEventListener('click', processPlayerMove);
    noMovesBtn.addEventListener('click', checkNoMoves);
    // styleSelect.addEventListener('change', () => changeStyle(styleSelect)); // Більше не потрібно
    showBoardCheckbox.addEventListener('change', toggleBoardVisibility);
    blockedModeCheckbox.addEventListener('change', () => {
        blockedMode = blockedModeCheckbox.checked;
        window.showingAvailableMoves = false;
        window.availableMoves = null;
        renderBoard();
        if (blockedMode) {
            messageAreaEl.textContent = "Режим заблокованих клітинок увімкнено! Клітинки стануть недоступними після ходу.";
        } else {
            messageAreaEl.textContent = "Режим заблокованих клітинок вимкнено.";
        }
    });
    if (showMovesCheckbox) {
        showMovesCheckbox.addEventListener('change', () => {
            if (showMovesCheckbox.checked) {
                showAvailableMoves();
            } else {
                window.showingAvailableMoves = false;
                window.availableMoves = null;
                renderBoard();
            }
        });
    }

    // Ініціалізуємо тему та стиль
    // initStyle(styleSelect); // Більше не потрібно
    initTheme();
    
    // Ініціалізуємо систему користувачів онлайн
    initOnlineUsers(onlineCountEl);
    
    // Оновлений виклик головного меню:
    openMainMenu();
    window.global_startGame = startGame;

    const menuBtn = document.getElementById('menu-btn');
    if (menuBtn) {
        menuBtn.addEventListener('click', openMainMenu);
    }
});

document.addEventListener('keydown', function(e) {
    // Якщо фокус у полі вводу, не реагуємо
    if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) return;
    // NUMPAD: 97-105 (1-9), 101 (5)
    const keyToDir = {
        103: 7, // NUM 7
        104: 8, // NUM 8
        105: 9, // NUM 9
        100: 4, // NUM 4
        102: 6, // NUM 6
        97: 1,  // NUM 1
        98: 2,  // NUM 2
        99: 3,  // NUM 3
        // Літери
        81: 7, // Q
        87: 8, // W
        69: 9, // E
        65: 4, // A
        68: 6, // D
        90: 1, // Z
        83: 2, // S
        88: 2, // X (альтернатива для ↓)
        67: 3  // C
    };
    if (e.keyCode in keyToDir) {
        const dir = keyToDir[e.keyCode];
        const btn = document.getElementById('dir-' + dir);
        if (btn) btn.click();
        e.preventDefault();
    } else if (e.keyCode === 101 || e.key === 'Enter' || e.key === ' ' ) { // NUM 5, Enter, Space
        const confirmBtn = document.getElementById('confirm-move-btn');
        if (confirmBtn) confirmBtn.click();
        e.preventDefault();
    } else if (e.key === 'Backspace') {
        const noMovesBtn = document.getElementById('no-moves-btn');
        if (noMovesBtn) noMovesBtn.click();
        e.preventDefault();
    }
});

