// === МОВНА ПІДТРИМКА ===
import { findPiece, hasValidMoves, getAllValidMoves, getDirectionDelta, getDirectionText, getDirectionArrow } from './game-core.js';
import { showModal, hideModal, renderBoard, toggleBoardVisibility, generateDistanceButtons, handleDirectionSelect, handleDistanceSelect, resetSelections, showMainMenu, showOnlineGameMenu, showRules, showControlsInfo, showBoardSizeSelection, initStyle, changeStyle, initTheme, toggleTheme, initOnlineUsers } from './ui.js';
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
    const version = "0.1";

    // Безкоштовний signaling сервер
    const SIGNALING_SERVER = 'wss://signaling-server-1.glitch.me';

    const gameBoardEl = document.getElementById('game-board');
    const scoreDisplayEl = document.getElementById('score-display');
    const messageAreaEl = document.getElementById('message-area');
    const hideBoardCheckbox = document.getElementById('hide-board-checkbox');
    const blockedModeCheckbox = document.getElementById('blocked-mode-checkbox');
    
    const visualControlsEl = document.getElementById('visual-controls');
    const directionGridEl = document.getElementById('direction-grid');
    const distanceSelectorEl = document.getElementById('distance-selector');
    const confirmMoveBtn = document.getElementById('confirm-move-btn');
    const noMovesBtn = document.getElementById('no-moves-btn');
    const debugMovesBtn = document.getElementById('debug-moves-btn');
    const styleSelect = document.getElementById('style-select');
    const computerMoveDisplayEl = document.getElementById('computer-move-display');
    const onlineCountEl = document.getElementById('online-count');
    const showMovesCheckbox = document.getElementById('show-moves-checkbox');

    function updateComputerMoveDisplay({direction, distance, isComputer, isPlayer}) {
        const el = computerMoveDisplayEl;
        if (!el) return;
        let html = '';
        let color = isComputer ? '#d32f2f' : (isPlayer ? '#1976d2' : '');
        el.classList.remove('confirm-btn-active');
        el.onclick = null;
        if (isComputer || isPlayer) {
            if (direction && distance) {
                html = `<span style="color: ${color}; font-size: 1em; font-weight: bold;">${getDirectionArrow(direction)} ${distance}</span>`;
                if (isPlayer) {
                    el.classList.add('confirm-btn-active');
                    el.onclick = () => {
                        if (selectedDirection && selectedDistance) {
                            confirmMoveBtn.click();
                        }
                    };
                }
            } else if (direction) {
                html = `<span style="color: ${color}; font-size: 2em; font-weight: bold;">${getDirectionArrow(direction)}</span>`;
            } else if (distance) {
                html = `<span style="color: ${color}; font-size: 2em; font-weight: bold;">${distance}</span>`;
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

    function startGame(size) {
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
        
        hideBoardCheckbox.checked = false;
        gameBoardEl.classList.remove('board-hidden');
        renderBoard();
        generateDistanceButtons();
        resetSelections(true);
        hideModal();
        
        const modeText = blockedMode ? " (режим заблокованих клітинок)" : "";
        messageAreaEl.textContent = `Ваш хід: оберіть напрямок та відстань.${modeText}`;
        visualControlsEl.classList.remove('hidden');
        updateComputerMoveDisplay({});
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
                    endOnlineGame(reason);
                } else {
                    endGame(reason);
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
            updateComputerMoveDisplay({});
            if (isOnlineGame) {
                playerTurnIndicatorEl.textContent = 'Хід суперника';
                
                // Надсилаємо хід супернику
                const move = {
                    direction: selectedDirection,
                    distance: selectedDistance
                };
                sendMoveToOpponent(move);
            } else {
                setTimeout(computerMove, 1000);
            }
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
                endGame(reason);
            }
        }
    }

    function checkNoMoves() {
        if (!isPlayerTurn) return;
        
        if (hasValidMoves(board, blockedCells, blockedMode, numberCells)) {
            const reason = "Ви заявили про відсутність ходів, але у вас є можливі ходи. Гра закінчена!";
            if (isOnlineGame) {
                endOnlineGame(reason);
            } else {
                endGame(reason);
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
                endGame(reason);
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
        
        messageAreaEl.textContent = movesText;
        
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
        // Після всіх змін — якщо чекбокс увімкнено, показати доступні ходи для гравця
        if (showMovesCheckbox && showMovesCheckbox.checked) {
            showAvailableMoves();
        }
        // setTimeout видалено, центр не очищається автоматично
    }

    function endGame(reason) {
        isPlayerTurn = false;
        visualControlsEl.classList.add('hidden');
        showModal(
            "Гра закінчена!",
            `<p>${reason}</p><p><strong>Кількість набраних очок: ${points}</strong></p><p>Версія гри: ${version}</p>`,
            [
                { text: "Вибрати розмір дошки", class: "primary", onClick: openBoardSizeSelection },
                { text: "Меню", onClick: openMainMenu }
            ]
        );
    }

    function toggleBoardVisibility() {
        if (hideBoardCheckbox.checked) {
            gameBoardEl.classList.add('board-hidden');
        } else {
            gameBoardEl.classList.remove('board-hidden');
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
        // Вибираємо першу кнопку (відстань 1) за замовчуванням
        const firstBtn = distanceSelectorEl.querySelector('.distance-btn');
        if (firstBtn) {
            firstBtn.classList.add('selected');
            selectedDistance = 1;
            updateComputerMoveDisplay({direction: selectedDirection, distance: selectedDistance, isPlayer: true});
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
            updateComputerMoveDisplay({}); // Очищаємо центр перед показом вибору гравця
            updateComputerMoveDisplay({direction: selectedDirection, distance: selectedDistance, isPlayer: true});
        }
    }

    function handleDistanceSelect(e) {
        if (e.target.classList.contains('distance-btn')) {
            document.querySelectorAll('.distance-btn').forEach(btn => btn.classList.remove('selected'));
            e.target.classList.add('selected');
            selectedDistance = parseInt(e.target.dataset.distance);
            updateComputerMoveDisplay({}); // Очищаємо центр перед показом вибору гравця
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
            showModal, t, openRules, openControlsInfo, openBoardSizeSelection, openOnlineGameMenu
        );
    }
    function openBoardSizeSelection() {
        showBoardSizeSelection(
            showModal, t, openMainMenu, openRules, openControlsInfo, openOnlineGameMenu
        );
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
    debugMovesBtn.addEventListener('click', showAvailableMoves);
    // styleSelect.addEventListener('change', () => changeStyle(styleSelect)); // Більше не потрібно
    hideBoardCheckbox.addEventListener('change', toggleBoardVisibility);
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
});

