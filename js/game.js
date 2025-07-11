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
import { listRooms as fetchPeerRooms, hostRoom as createPeerHost, joinRoom as connectToPeerRoom, sendMessage as sendPeerMessage, generateRoomId } from './network.js';
import { speakMove, speakGameMessage, stopSpeaking, isSpeechEnabled, initVoices, getAvailableVoices, getVoicesForLanguage, setVoiceForLanguage, getCurrentVoice } from './speech.js';

if (!window.translations) {
    window.translations = window.translationsAll && window.translationsAll['uk'] ? window.translationsAll['uk'] : {};
}

document.addEventListener('DOMContentLoaded', () => {
    // Якщо мова не встановлена у localStorage, явно встановлюємо українську
    if (!localStorage.getItem('lang')) {
        localStorage.setItem('lang', 'uk');
    }
    // Завжди оновлюємо window.translations та currentLang відповідно до localStorage
    import('./localization.js').then(module => {
        module.loadLanguage(localStorage.getItem('lang'), module.updateUIWithLanguage);
    });

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

    // === PeerJS Online ===
    let peerInstance = null;      // Поточний Peer
    let peerConn = null;          // DataConnection з суперником
    let onlineRoomId = null;      // ID кімнати
    let pendingBoardSize = null;  // Розмір дошки, вибраний хостом до підключення гостя

    // Заглушки, які використовуються до ініціалізації
    let sendMoveToOpponent = () => {};
    let endOnlineGame = (reason) => {
        console.warn('[OnlineGame] Завершення гри:', reason);
        endGame(reason, false);
        if (peerInstance) try { peerInstance.destroy(); } catch (e) {}
    };

    const version = "0.1.5";

    let currentGameMode = 'vsComputer'; // 'vsComputer' або 'localTwoPlayer'
    let currentPlayer = 1; // 1 або 2 для режиму localTwoPlayer
    let player1Name = 'Гравець 1';
    let player2Name = 'Гравець 2';

    let firstMoveDone = false;
    let speechEnabled = false; // Стан озвучування

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
    const speechEnabledCheckbox = document.getElementById('speech-enabled-checkbox');
    const speechEnabledLabel = document.getElementById('speech-enabled-label');
    const voiceSettingsToggle = document.getElementById('voice-settings-toggle');
    const voiceSettings = document.getElementById('voice-settings');
    const voiceSelectors = document.getElementById('voice-selectors');
    const player1Glow = document.getElementById('player1-glow');
    const player2Glow = document.getElementById('player2-glow');

    // Ініціалізація озвучування
    function initSpeech() {
        if (isSpeechEnabled()) {
            initVoices();
            // Завантажуємо збережений стан
            const savedSpeechState = localStorage.getItem('speechEnabled');
            speechEnabled = savedSpeechState === 'true';
            if (speechEnabledCheckbox) {
                speechEnabledCheckbox.checked = speechEnabled;
            }
            
            // Приховуємо налаштування голосів за замовчуванням
            if (voiceSettings) {
                voiceSettings.style.display = 'none';
            }
            
            // Додаємо обробники подій
            if (speechEnabledCheckbox) {
                speechEnabledCheckbox.addEventListener('change', handleSpeechToggle);
            }
            
            if (voiceSettingsToggle) {
                voiceSettingsToggle.addEventListener('click', toggleVoiceSettings);
            }
        } else {
            // Якщо озвучування не підтримується, приховуємо чекбокс
            if (speechEnabledCheckbox && speechEnabledLabel) {
                speechEnabledCheckbox.style.display = 'none';
                speechEnabledLabel.style.display = 'none';
            }
            if (voiceSettings) {
                voiceSettings.style.display = 'none';
            }
            if (voiceSettingsToggle) {
                voiceSettingsToggle.style.display = 'none';
            }
        }
    }

    // Функція для створення селекторів голосів
    function createVoiceSelectors() {
        if (!voiceSelectors || !isSpeechEnabled()) return;
        
        // Визначаємо поточну мову
        const lang = localStorage.getItem('lang') || 'uk';
        const languages = [
            { code: 'uk', name: 'Українська' },
            { code: 'en', name: 'English' },
            { code: 'crh', name: 'Кримськотатарська' },
            { code: 'nl', name: 'Nederlands' }
        ];
        const currentLanguage = languages.find(l => l.code === lang);
        voiceSelectors.innerHTML = '';
        if (currentLanguage) {
            const voices = getVoicesForLanguage(currentLanguage.code);
            const currentVoice = getCurrentVoice(currentLanguage.code);
            if (voices.length > 0) {
                const container = document.createElement('div');
                const label = document.createElement('label');
                label.textContent = currentLanguage.name;
                const select = document.createElement('select');
                voices.forEach(voice => {
                    const option = document.createElement('option');
                    option.value = voice.name;
                    option.textContent = `${voice.name} (${voice.lang})`;
                    option.selected = currentVoice && currentVoice.name === voice.name;
                    select.appendChild(option);
                });
                select.addEventListener('change', (e) => {
                    const success = setVoiceForLanguage(currentLanguage.code, e.target.value);
                    if (success) {
                        console.log(`[Speech] Голос для ${currentLanguage.name} змінено на: ${e.target.value}`);
                    }
                });
                container.appendChild(label);
                container.appendChild(select);
                voiceSelectors.appendChild(container);
            }
        }
    }

    // Функція для перемикання видимості налаштувань голосів
    function toggleVoiceSettings() {
        if (!voiceSettings) return;
        const isVisible = voiceSettings.style.display === 'block';
        voiceSettings.style.display = isVisible ? 'none' : 'block';
        
        // Змінюємо стиль кнопки для індикації стану
        if (voiceSettingsToggle) {
            voiceSettingsToggle.style.transform = isVisible ? 'rotate(0deg)' : 'rotate(90deg)';
            voiceSettingsToggle.style.background = isVisible ? 'transparent' : 'var(--control-bg)';
        }
        
        // Якщо показуємо налаштування, створюємо селектори
        if (!isVisible) {
            setTimeout(createVoiceSelectors, 100);
        }
    }

    // Обробник зміни стану озвучування
    function handleSpeechToggle() {
        if (speechEnabledCheckbox) {
            speechEnabled = speechEnabledCheckbox.checked;
            localStorage.setItem('speechEnabled', speechEnabled.toString());
            
            // Приховуємо налаштування голосів при вимкненні озвучування
            if (voiceSettings) {
                voiceSettings.style.display = 'none';
            }
            
            // Скидаємо стиль кнопки налаштувань
            if (voiceSettingsToggle) {
                voiceSettingsToggle.style.transform = 'rotate(0deg)';
                voiceSettingsToggle.style.background = 'transparent';
            }
            
            if (speechEnabled) {
                console.log('[Speech] Озвучування увімкнено');
            } else {
                console.log('[Speech] Озвучування вимкнено');
                stopSpeaking();
            }
        }
    }

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
    const flagMap = { uk: 'flag-uk', en: 'flag-en', crh: 'flag-crh', nl: 'flag-nl' };

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
        classic: { uk: 'Ubuntu', en: 'Ubuntu', crh: 'Ubuntu', nl: 'Ubuntu' },
        peak: { uk: 'PEAK', en: 'PEAK', crh: 'PEAK', nl: 'PEAK' },
        cs2: { uk: 'CS 2', en: 'CS 2', crh: 'CS 2', nl: 'CS 2' },
        glass: { uk: 'Glassmorphism', en: 'Glassmorphism', crh: 'Glassmorphism', nl: 'Glassmorphism' },
        material: { uk: 'Material You', en: 'Material You', crh: 'Material You', nl: 'Material You' }
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
        console.log('[updateLangFlag] Current lang:', lang);
        console.log('[updateLangFlag] Flag map:', flagMap);
        console.log('[updateLangFlag] Flag class:', 'flag ' + (flagMap[lang] || 'flag-uk'));
        langFlag.className = 'flag ' + (flagMap[lang] || 'flag-uk');
        langOptions.forEach(opt => {
            opt.classList.toggle('selected', opt.getAttribute('data-lang') === lang);
        });
        console.log('[updateLangFlag] Updated flag element:', langFlag);
    }

    // ------------------------------------------------------------
    // Функції для застосування перекладу до статичних елементів UI
    // ------------------------------------------------------------

    function setLabelText(labelEl, text) {
        if (!labelEl) return;
        // Видаляємо існуючі текстові ноди, щоб не дублювати текст
        Array.from(labelEl.childNodes).forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) {
                labelEl.removeChild(node);
            }
        });
        labelEl.insertAdjacentText('beforeend', ' ' + text);
    }

    function applyTranslationsToStaticUI() {
        // Top-controls
        if (themeStyleBtn) themeStyleBtn.title = t('topControls.themeStyle');
        if (langBtn) langBtn.title = t('topControls.language');
        const donateBtn = document.getElementById('donate-btn');
        if (donateBtn) donateBtn.title = t('topControls.donate');

        // Board options
        setLabelText(document.getElementById('show-moves-label'), t('board.showMoves'));
        setLabelText(document.getElementById('show-board-label'), t('board.showBoard'));
        setLabelText(document.getElementById('blocked-mode-label'), t('board.blockedMode'));
        setLabelText(document.getElementById('speech-enabled-label'), t('board.speechEnabled'));

        // Voice settings
        const voiceSettingsTitle = document.getElementById('voice-settings-title');
        if (voiceSettingsTitle) voiceSettingsTitle.textContent = t('board.voiceSettingsTitle');
        if (voiceSettingsToggle) voiceSettingsToggle.title = t('board.voiceSettings');

        // Visual controls
        const selectDistanceLabel = document.getElementById('select-distance-label');
        if (selectDistanceLabel) selectDistanceLabel.textContent = t('visual.selectDistance');
        if (confirmMoveBtn) confirmMoveBtn.textContent = t('visual.confirmMove');
        if (noMovesBtn) noMovesBtn.textContent = t('visual.noMoves');

        // Score panel
        const scoreLabel = document.getElementById('score-label');
        if (scoreLabel) scoreLabel.textContent = t('scorePanel.score');
        const onlineText = document.getElementById('online-text');
        if (onlineText) onlineText.textContent = t('scorePanel.online');

        // Menu button
        const menuBtn = document.getElementById('menu-btn');
        if (menuBtn) {
            menuBtn.title = t('menu.exit');
            menuBtn.setAttribute('aria-label', t('menu.exit'));
        }
    }
 
    langOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            const lang = opt.getAttribute('data-lang');
            console.log('[langOption] Clicked on language:', lang);
            loadLanguage(lang);
            updateLangFlag();
            applyTranslationsToStaticUI();
            updateStyleDropdownLang();
            langDropdown.classList.add('hidden');
        });
    });
    updateLangFlag();
    applyTranslationsToStaticUI();

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
        
        const modeText = blockedMode ? ' (' + t('ui.blockedMode') + ')' : '';
        if (currentGameMode === 'localTwoPlayer') {
            currentPlayer = 1;
            messageAreaEl.textContent = t('ui.playerMove', { player: player1Name, mode: modeText });
        } else {
            messageAreaEl.textContent = t('ui.yourMove') + modeText;
        }
        visualControlsEl.classList.remove('hidden');
        updateComputerMoveDisplay({});
        firstMoveDone = false;
        updatePlayerGlow();
    }

    function animatePieceMove(fromRow, fromCol, toRow, toCol, callback) {
        if (confirmMoveBtn) confirmMoveBtn.setAttribute('disabled', true);
        // Знайти позицію дошки на сторінці
        const boardRect = gameBoardEl.getBoundingClientRect();
        // Знайти всі клітинки
        const cells = gameBoardEl.querySelectorAll('.cell');
        const getCellIndex = (row, col) => row * numberCells + col;
        const fromCell = cells[getCellIndex(fromRow, fromCol)];
        const toCell = cells[getCellIndex(toRow, toCol)];
        if (!fromCell || !toCell) {
            callback();
            return;
        }
        // Вирахувати координати
        const fromRect = fromCell.getBoundingClientRect();
        const toRect = toCell.getBoundingClientRect();
        // Створити анімовану фігуру
        const animPiece = document.createElement('div');
        animPiece.className = 'piece-animating';
        animPiece.textContent = '♛';
        // Початкові координати
        animPiece.style.left = (fromRect.left - boardRect.left) + 'px';
        animPiece.style.top = (fromRect.top - boardRect.top) + 'px';
        animPiece.style.position = 'absolute';
        animPiece.style.width = fromCell.offsetWidth + 'px';
        animPiece.style.height = fromCell.offsetHeight + 'px';
        // Додаємо до дошки
        gameBoardEl.appendChild(animPiece);
        // Форсуємо reflow
        void animPiece.offsetWidth;
        // Кінцеві координати
        animPiece.style.left = (toRect.left - boardRect.left) + 'px';
        animPiece.style.top = (toRect.top - boardRect.top) + 'px';
        // Після завершення анімації
        animPiece.addEventListener('transitionend', () => {
            animPiece.remove();
            if (confirmMoveBtn) confirmMoveBtn.removeAttribute('disabled');
            callback();
        }, { once: true });
    }

    function fadeAvailableCells() {
        document.querySelectorAll('.cell-available').forEach(cell => {
            cell.classList.remove('cell-available-appear'); // Забрати клас появи для коректної анімації зникнення
            cell.classList.add('cell-available-fade');
        });
    }

    function processPlayerMove() {
        console.log('[processPlayerMove] called', { isPlayerTurn, selectedDirection, selectedDistance });
        if (!isPlayerTurn) {
            console.log('[processPlayerMove] Not player turn');
            return;
        }
        if (!selectedDirection || !selectedDistance) {
            messageAreaEl.textContent = t('ui.selectDirectionAndDistance');
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
                const reason = t('end.blockedCell', { direction: directionText });
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
            
            fadeAvailableCells(); // Плавно приховати галочки одразу після підтвердження ходу
            const boardIsVisible = !gameBoardEl.classList.contains('board-hidden');
            if (boardIsVisible) {
                // Очистити стару клітинку перед анімацією
                const cells = gameBoardEl.querySelectorAll('.cell');
                const getCellIndex = (row, col) => row * numberCells + col;
                const fromCell = cells[getCellIndex(row, col)];
                if (fromCell) {
                    fromCell.textContent = '';
                    fromCell.classList.remove('piece');
                }
                animatePieceMove(row, col, newRow, newCol, () => {
                    if (blockedMode) {
                        blockedCells.push({ row, col });
                    }
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
                    updateComputerMoveDisplay({});
                    if (isOnlineGame) {
                        playerTurnIndicatorEl.textContent = 'Хід суперника';
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
                        messageAreaEl.textContent = t('ui.playerMove', { player: nextPlayerName, mode: '' });
                        updateComputerMoveDisplay({});
                        if (showMovesCheckbox && showMovesCheckbox.checked) {
                            window.availableMoves = null;
                            window.showingAvailableMoves = false;
                            showAvailableMoves();
                        }
                    }
                    updatePlayerGlow();
                    if (showMovesCheckbox && showMovesCheckbox.checked) {
                        showAvailableMoves();
                    }
                    if (!firstMoveDone) {
                        showBoardCheckbox.checked = false;
                        toggleBoardVisibility();
                        firstMoveDone = true;
                    }
                });
            } else {
                // Без анімації, якщо дошка прихована
                if (blockedMode) {
                    blockedCells.push({ row, col });
                }
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
                updateComputerMoveDisplay({});
                if (isOnlineGame) {
                    playerTurnIndicatorEl.textContent = 'Хід суперника';
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
                    messageAreaEl.textContent = t('ui.playerMove', { player: nextPlayerName, mode: '' });
                    updateComputerMoveDisplay({});
                    if (showMovesCheckbox && showMovesCheckbox.checked) {
                        window.availableMoves = null;
                        window.showingAvailableMoves = false;
                        showAvailableMoves();
                    }
                }
                updatePlayerGlow();
                if (showMovesCheckbox && showMovesCheckbox.checked) {
                    showAvailableMoves();
                }
                if (!firstMoveDone) {
                    showBoardCheckbox.checked = false;
                    toggleBoardVisibility();
                    firstMoveDone = true;
                }
            }
        } else {
            const directionText = getDirectionText(selectedDirection);
            const reason = t('end.outOfBounds', { distance: selectedDistance, direction: directionText });
            console.log('[processPlayerMove] Out of bounds', { newRow, newCol });
            if (isOnlineGame) {
                endOnlineGame(reason);
            } else {
                endGame(reason, false);
            }
        }
    }

    function checkNoMoves() {
        if (!isPlayerTurn) return;
        
        if (hasValidMoves(board, blockedCells, blockedMode, numberCells)) {
            const reason = t('end.noMovesFalse');
            if (isOnlineGame) {
                endOnlineGame(reason);
            } else {
                endGame(reason, false);
            }
        } else {
            const reason = t('end.noMovesTrue');
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
            messageAreaEl.textContent = t('ui.noAvailableMoves');
            return;
        }
        
        window.availableMoves = validMoves;
        window.showingAvailableMoves = true;
        renderBoard();
        
        // Анімація появи галочок
        setTimeout(() => {
            document.querySelectorAll('.cell-available').forEach(cell => {
                cell.classList.add('cell-available-appear');
            });
        }, 10);
        
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
            endGame(t('ui.computerNoMovesWin'));
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
        
        const boardIsVisible = !gameBoardEl.classList.contains('board-hidden');
        if (boardIsVisible) {
            // Очистити стару клітинку перед анімацією
            const cells = gameBoardEl.querySelectorAll('.cell');
            const getCellIndex = (row, col) => row * numberCells + col;
            const fromCell = cells[getCellIndex(row, col)];
            if (fromCell) {
                fromCell.textContent = '';
                fromCell.classList.remove('piece');
            }
            animatePieceMove(row, col, newRow, newCol, () => {
                if (blockedMode) {
                    blockedCells.push({ row, col });
                }
                board[row][col] = 0;
                board[newRow][newCol] = 1;
                renderBoard();
                generateDistanceButtons();
                resetSelections(true);
                const directionText = getDirectionText(randomMove.direction);
                messageAreaEl.textContent = t('ui.computerMove', { direction: directionText, distance: randomMove.distance });
                updateComputerMoveDisplay({direction: randomMove.direction, distance: randomMove.distance, isComputer: true});
                if (speechEnabled) {
                    const currentLang = localStorage.getItem('lang') || 'uk';
                    speakMove(randomMove.direction, randomMove.distance, currentLang);
                }
                if (showMovesCheckbox && showMovesCheckbox.checked) {
                    window.availableMoves = null;
                    window.showingAvailableMoves = false;
                    showAvailableMoves();
                } else {
                    window.showingAvailableMoves = false;
                    window.availableMoves = null;
                }
                isPlayerTurn = true;
                updatePlayerGlow();
                if (showMovesCheckbox && showMovesCheckbox.checked) {
                    showAvailableMoves();
                }
            });
        } else {
            // Без анімації, якщо дошка прихована
            if (blockedMode) {
                blockedCells.push({ row, col });
            }
            board[row][col] = 0;
            board[newRow][newCol] = 1;
            renderBoard();
            generateDistanceButtons();
            resetSelections(true);
            const directionText = getDirectionText(randomMove.direction);
            messageAreaEl.textContent = t('ui.computerMove', { direction: directionText, distance: randomMove.distance });
            updateComputerMoveDisplay({direction: randomMove.direction, distance: randomMove.distance, isComputer: true});
            if (speechEnabled) {
                const currentLang = localStorage.getItem('lang') || 'uk';
                speakMove(randomMove.direction, randomMove.distance, currentLang);
            }
            if (showMovesCheckbox && showMovesCheckbox.checked) {
                window.availableMoves = null;
                window.showingAvailableMoves = false;
                showAvailableMoves();
            } else {
                window.showingAvailableMoves = false;
                window.availableMoves = null;
            }
            isPlayerTurn = true;
            updatePlayerGlow();
            if (showMovesCheckbox && showMovesCheckbox.checked) {
                showAvailableMoves();
            }
        }
    }

    function endGame(reason, isWin = false) {
        isPlayerTurn = false;
        visualControlsEl.classList.add('hidden');

        let title = isWin ? t('end.winTitle') : t('end.loseTitle');
        let finalReason = reason;

        if (currentGameMode === 'localTwoPlayer' && !isWin) {
            const loserName = (currentPlayer === 1) ? player1Name : player2Name;
            finalReason = t('end.playerLost', { player: loserName, reason });
        }
        updatePlayerGlow();
        updateComputerMoveDisplay({}); // Скидаємо колір фону
        
        // Озвучуємо результат гри, якщо увімкнено
        if (speechEnabled) {
            const currentLang = localStorage.getItem('lang') || 'uk';
            const message = isWin ? t('end.winTitle') : t('end.loseTitle');
            speakGameMessage(message, currentLang);
        }

        showModal(
            title,
            `<p>${finalReason}</p><p><strong>${t('end.score', { score: points })}</strong></p><p>${t('end.version', { version })}</p>`,
            [
                { text: t('end.chooseBoardSize'), class: "primary", onClick: () => openBoardSizeSelection(currentGameMode) },
                { text: t('end.menu'), onClick: openMainMenu }
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
        const topControls = document.getElementById('top-controls');
        if (topControls) topControls.classList.add('hidden');

        function showJoinByIdModal() {
            showModal(t('onlineMenu.joinByIdTitle'),
                `<input id='join-room-id-input' class='modal-input' style='width:80%;margin:16px auto;display:block;text-align:center;font-size:1.2em;border-radius:8px;border:2px solid var(--control-selected);' placeholder='ROOM_ID'>`,
                [
                    {
                        text: t('onlineMenu.joinByIdConfirm'), class: 'primary',
                        onClick: () => {
                            const id = document.getElementById('join-room-id-input').value.trim();
                            if (id) {
                                hideModal();
                                joinRoomById(id);
                            }
                        }
                    },
                    { text: t('common.back'), onClick: openOnlineGameMenu }
                ]
            );
        }

        const body = `
            <div style="display:flex;flex-direction:column;gap:8px;align-items:center;">
                <button id="join-by-id-btn" class="modal-button secondary" style="width:60%;margin-top:8px;">${t('onlineMenu.joinById')}</button>
            </div>`;

        showModal(t('onlineMenu.title'), body, [
            { text: t('onlineMenu.createRoom'), class: 'primary', onClick: () => { hideModal(); createRoom(); } },
            { text: t('onlineMenu.back'), onClick: openMainMenu }
        ]);

        setTimeout(() => {
            const joinByIdBtn = document.getElementById('join-by-id-btn');
            if (joinByIdBtn) joinByIdBtn.onclick = showJoinByIdModal;
        }, 0);
    }

    function setupPeerConnHandlers(conn) {
        peerConn = conn;
        // Функція відправки ходів тепер зрозуміла
        sendMoveToOpponent = (move) => {
            sendPeerMessage(peerConn, { type: 'move', ...move });
        };

        conn.on('data', (raw) => {
            let data;
            try { data = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch (e) { data = raw; }
            if (!data || !data.type) return;
            if (data.type === 'handshake') {
                console.log('[Online] Handshake отримано', data);
                if (isHost) {
                    // Хост отримав підтвердження від гостя
                    if (pendingBoardSize) {
                        hideModal();
                        startGame(pendingBoardSize, 'onlineHost');
                        pendingBoardSize = null;
                    }
                } else {
                    // Гість запускає гру
                    if (!numberCells && data.boardSize && data.boardSize >= 2) {
                        startGame(data.boardSize, 'onlineGuest');
                    }
                }
            } else if (data.type === 'move') {
                console.log('[Online] Отримано хід суперника', data);
                applyOpponentMove(data.direction, data.distance);
            }
        });

        conn.on('close', () => {
            console.warn('[Online] Зʼєднання закрито');
            endOnlineGame('Зʼєднання перервано');
        });
    }

    // Функція для виконання ходу, отриманого від суперника
    function applyOpponentMove(direction, distance) {
        isPlayerTurn = false; // Щоб уникнути паралельних ходів
        const piecePos = findPiece(board, numberCells);
        if (!piecePos) return;
        const { dr, dc } = getDirectionDelta(direction);
        const newRow = piecePos.row + dr * distance;
        const newCol = piecePos.col + dc * distance;
        if (newRow < 0 || newRow >= numberCells || newCol < 0 || newCol >= numberCells) {
            const reason = t('end.outOfBounds', { distance, direction: getDirectionText(direction) });
            endOnlineGame(reason);
            return;
        }
        // Блокуємо клітинку, з якої рухався противник, якщо це потрібно
        if (blockedMode) {
            blockedCells.push({ row: piecePos.row, col: piecePos.col });
        }
        board[piecePos.row][piecePos.col] = 0;
        board[newRow][newCol] = 1;
        renderBoard();
        if (showMovesCheckbox && showMovesCheckbox.checked) {
            showAvailableMoves();
        }
        isPlayerTurn = true; // Тепер наш хід
        messageAreaEl.textContent = 'Ваш хід';
    }

    // === Хост створює кімнату ===
    function createRoom() {
        const defaultName = generateRandomRoomName();
        const body = `
            <p style="text-align:center;">Введіть назву кімнати</p>
            <input type="text" id="room-name-input" class="modal-input" style="width:100%;text-align:center;max-width:160px;font-size:1.2em;letter-spacing:1px;text-transform:uppercase;" value="${defaultName}" maxlength="12">
        `;
        showModal(t('onlineMenu.createRoom'), body, [
            {
                text: t('onlineMenu.createRoom'),
                class: 'primary',
                onClick: () => {
                    const name = (document.getElementById('room-name-input').value || '').trim().toUpperCase();
                    if (!name) {
                        alert('Вкажіть назву');
                        return;
                    }
                    hideModal();
                    hostWithName(name);
                }
            },
            { text: t('common.back'), onClick: openOnlineGameMenu }
        ]);

        function hostWithName(roomName) {
            const { roomId, peer } = createPeerHost(roomName, (conn) => {
                console.log('[Online] Гість підʼєднався');
                setupPeerConnHandlers(conn);
                sendPeerMessage(conn, { type: 'handshake', boardSize: numberCells || 0 });
            }, (err) => {
                alert('PeerJS error: ' + err);
            });

            peerInstance = peer;
            onlineRoomId = roomId;
            isOnlineGame = true;
            isHost = true;

            // Вибір розміру дошки
            setTimeout(() => {
                showBoardSizeSelection(
                    showModal,
                    t,
                    (size) => {
                        pendingBoardSize = size;
                        // Показуємо повідомлення про очікування суперника
                        showModal('Очікуємо гравця', `<p style="text-align:center;">Кімната <b>${roomId}</b><br>Очікуємо підключення...</p>`, [
                            { text: t('onlineMenu.back'), onClick: openMainMenu }
                        ]);
                        if (peerConn) {
                            sendPeerMessage(peerConn, { type: 'handshake', boardSize: size });
                            hideModal();
                            startGame(size, 'onlineHost');
                        }
                    },
                    openMainMenu
                );
            }, 0);
        }

        function generateRandomRoomName() {
            return generateRoomId(); // використовую ту ж функцію, 6 символів
        }
    }

    // === Гість приєднується до кімнати ===
    function joinRoom() {
        // Просимо код кімнати (6 символів)
        const body = `
            <p style="text-align:center;">${t('online.enterRoomCode')}</p>
            <input type="text" id="player-name-input-online" class="modal-input" placeholder="Ваше ім'я" style="width:100%;text-align:center;max-width:180px;font-size:1.15em;margin-bottom:12px;">
            <input type="text" id="room-code-input" class="modal-input" style="width:100%;text-align:center;max-width:140px;font-size:1.4em;letter-spacing:2px;text-transform:uppercase;" maxlength="6">
        `;
        showModal(t('onlineMenu.joinRoom'), body, [
            {
                text: t('onlineMenu.joinRoom'),
                class: 'primary',
                onClick: () => {
                    const code = (document.getElementById('room-code-input').value || '').trim().toUpperCase();
                    const yourName = (document.getElementById('player-name-input-online').value || '').trim();
                    if (yourName) {
                        player1Name = yourName;
                    }
                    if (code.length !== 6) {
                        alert(t('online.invalidRoomCode'));
                        return;
                    }
                    hideModal();
                    attemptJoin(code);
                }
            },
            { text: t('common.back'), onClick: openOnlineGameMenu }
        ]);

        function attemptJoin(code) {
            showModal(t('online.connecting'), `<p style="text-align:center;">${t('online.connectingToRoom', { roomId: code })}</p>`, []);
            const { peer } = connectToPeerRoom(code, (conn) => {
                peerInstance = peer;
                onlineRoomId = code;
                setupPeerConnHandlers(conn);
                // Очікуємо handshake з розміром дошки
            }, (err) => {
                alert('PeerJS error: ' + err);
                openMainMenu();
            });
        }
    }

    function joinRoomById(id) {
        joinRoomWithCode(id);
    }
    function joinRoomWithCode(code) {
        // Проксі до joinRoom() із попередньою логікою
        const savedJoinRoom = joinRoom; // function defined нижче
        if (savedJoinRoom) {
            // Показати одразу з'єднання без повторного введення коду
            hideModal();
            showModal(t('online.connecting'), `<p style="text-align:center;">${t('online.connectingToRoom', { roomId: code })}</p>`, []);
            const { peer } = connectToPeerRoom(code, (conn) => {
                peerInstance = peer;
                onlineRoomId = code;
                setupPeerConnHandlers(conn);
            }, (err) => {
                alert('PeerJS error: ' + err);
                openMainMenu();
            });
        }
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
    
    // Ініціалізуємо озвучування
    initSpeech();
    
    // Ініціалізуємо систему користувачів онлайн
    initOnlineUsers(onlineCountEl);
    
    // Ініціалізуємо прапор мови
    updateLangFlag();
    applyTranslationsToStaticUI();

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

const APP_VERSION = "0.1.5";
(function checkAppVersionAndClearCacheIfNeeded() {
    try {
        const storedVersion = localStorage.getItem('appVersion');
        if (storedVersion && storedVersion !== APP_VERSION) {
            // Очищення localStorage, sessionStorage
            localStorage.clear();
            sessionStorage.clear();
            // Очищення cookies
            document.cookie.split(';').forEach(function(c) {
                document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date(0).toUTCString() + ';path=/');
            });
            // Оновлюємо версію
            localStorage.setItem('appVersion', APP_VERSION);
            // Перезавантаження сторінки
            window.location.reload();
        } else {
            // Якщо версія не збережена або співпадає, просто оновлюємо версію
            localStorage.setItem('appVersion', APP_VERSION);
        }
    } catch (e) {
        // Якщо щось пішло не так, не блокуємо завантаження сайту
        console.error('Version check/cache clear error:', e);
    }
})();

