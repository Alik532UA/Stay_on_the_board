// ui.js — робота з інтерфейсом

export function showModal(title, bodyHTML, buttons = [], modalOverlay, modalTitle, modalBody, modalFooter) {
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

export function hideModal(modalOverlay) {
    modalOverlay.classList.add('hidden');
}

export function renderBoard(board, numberCells, blockedMode, blockedCells, gameBoardEl, scoreDisplayEl) {
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
            if (blockedMode && blockedCells.some(pos => pos.row === i && pos.col === j)) {
                cell.classList.add('cell-blocked');
            }
            if (board[i][j] === 1) {
                cell.classList.add('piece');
                cell.textContent = '♛';
            }
            gameBoardEl.appendChild(cell);
        }
    }
    scoreDisplayEl.textContent = board.flat().filter(x => x === 1).length;
}

export function toggleBoardVisibility(hideBoardCheckbox, gameBoardEl) {
    if (hideBoardCheckbox.checked) {
        gameBoardEl.classList.add('board-hidden');
    } else {
        gameBoardEl.classList.remove('board-hidden');
    }
}

export function generateDistanceButtons(numberCells, distanceSelectorEl) {
    distanceSelectorEl.innerHTML = '';
    for (let i = 1; i < numberCells; i++) {
        const button = document.createElement('button');
        button.classList.add('distance-btn');
        button.textContent = i;
        button.dataset.distance = i;
        distanceSelectorEl.appendChild(button);
    }
}

export function handleDirectionSelect(e, setSelectedDirection) {
    if (e.target.classList.contains('control-btn')) {
        document.querySelectorAll('.control-btn').forEach(btn => btn.classList.remove('selected'));
        e.target.classList.add('selected');
        setSelectedDirection(parseInt(e.target.dataset.direction));
    }
}

export function handleDistanceSelect(e, setSelectedDistance) {
    if (e.target.classList.contains('distance-btn')) {
        document.querySelectorAll('.distance-btn').forEach(btn => btn.classList.remove('selected'));
        e.target.classList.add('selected');
        setSelectedDistance(parseInt(e.target.dataset.distance));
    }
}

export function resetSelections() {
    document.querySelectorAll('.control-btn, .distance-btn').forEach(btn => btn.classList.remove('selected'));
}

export function showMainMenu(showModal, t, showRules, showControlsInfo, showBoardSizeSelection, showOnlineGameMenu) {
    showModal(
        'Stay on the Board',
        `<div style="text-align:center;font-size:1.1em;font-weight:500;margin-bottom:18px;color:var(--text-accent);">${t('mainMenu.title')}</div>`,
        [
            { text: t('mainMenu.playVsComputer'), class: "secondary", onClick: showBoardSizeSelection },
            { text: t('mainMenu.playOnline'), class: "primary", onClick: showOnlineGameMenu },
            { text: t('mainMenu.controls'), onClick: showControlsInfo },
            { text: t('mainMenu.rules'), onClick: showRules }
        ]
    );
}

export function showOnlineGameMenu(showModal, t, hideModal, createRoom, joinRoom, showMainMenu) {
    showModal(t('onlineMenu.title'), `<p>${t('onlineMenu.description')}</p>`, [
        { text: t('onlineMenu.createRoom'), class: "primary", onClick: () => { hideModal(); createRoom(); }},
        { text: t('onlineMenu.joinRoom'), class: "secondary", onClick: () => { hideModal(); joinRoom(); }},
        { text: t('onlineMenu.back'), onClick: showMainMenu }
    ]);
}

export function showRules(showModal, t, showMainMenu) {
    showModal(t('rules.title'), `<p>${t('rules.goal')}</p><p><strong>${t('rules.blockedModeTitle')}</strong> ${t('rules.blockedModeDesc')}</p><p><strong>${t('rules.noMovesBtnTitle')}</strong> ${t('rules.noMovesBtnDesc')}</p>`,
        [{ text: t('common.back'), class: "primary", onClick: showMainMenu }]
    );
}

export function showControlsInfo(showModal, t, hideModal) {
    showModal(t('controls.title'), `<p>${t('controls.desc')}</p><ul><li><b>${t('controls.arrows')}</b> - ${t('controls.direction')}</li><li><b>${t('controls.numbers')}</b> - ${t('controls.distance')}</li><li><b>${t('controls.confirmBtn')}</b> - ${t('controls.confirmMove')}</li><li><b>${t('controls.noMovesBtn')}</b> - ${t('controls.noMoves')}</li><li><b>${t('controls.hideBoard')}</b> - ${t('controls.memoryMode')}</li><li><b>${t('controls.blockedMode')}</b> - ${t('controls.blockedModeDesc')}</li></ul>`,
        [{ text: t('common.ok'), class: "primary", onClick: hideModal }]
    );
}

export function showBoardSizeSelection(showModal, t, showMainMenu, showRules, showControlsInfo, showOnlineGameMenu) {
    let body = `<p>${t('boardSize.select')}</p><div id="board-size-selector" style="display:flex; flex-wrap:wrap; gap:10px;">`;
    for (let i = 2; i <= 9; i++) {
        body += `<button class="modal-button secondary" onclick="window.global_startGame(${i})">${i}x${i}</button>`;
    }
    body += `</div>`;
    showModal(t('boardSize.title'), body, [{ text: t('common.backToMenu'), onClick: () => showMainMenu(showModal, t, showRules, showControlsInfo, showBoardSizeSelection, showOnlineGameMenu) }]);
}

export function initStyle(styleSelect) {
    const savedStyle = localStorage.getItem('style') || 'classic';
    document.documentElement.setAttribute('data-style', savedStyle);
    if (styleSelect) styleSelect.value = savedStyle;
}

export function changeStyle(styleSelect) {
    const selectedStyle = styleSelect.value;
    document.documentElement.setAttribute('data-style', selectedStyle);
    localStorage.setItem('style', selectedStyle);
}

export function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
    } else if (prefersDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
    }
}

export function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

function getOnlineUsers() {
    try {
        const users = localStorage.getItem('onlineUsers');
        return users ? JSON.parse(users) : [];
    } catch (error) {
        console.error('Помилка при отриманні списку користувачів:', error);
        return [];
    }
}

function saveOnlineUsers(users) {
    try {
        localStorage.setItem('onlineUsers', JSON.stringify(users));
    } catch (error) {
        console.error('Помилка при збереженні списку користувачів:', error);
    }
}

function updateOnlineCount(userId, onlineCountEl) {
    const now = Date.now();
    const onlineUsers = getOnlineUsers();
    const activeUsers = onlineUsers.filter(user => (now - user.lastSeen) < 5 * 60 * 1000);
    const currentUserIndex = activeUsers.findIndex(user => user.id === userId);
    if (currentUserIndex === -1) {
        activeUsers.push({ id: userId, lastSeen: now });
    } else {
        activeUsers[currentUserIndex].lastSeen = now;
    }
    saveOnlineUsers(activeUsers);
    const count = activeUsers.length;
    onlineCountEl.textContent = count;
    onlineCountEl.style.transform = 'scale(1.2)';
    setTimeout(() => {
        onlineCountEl.style.transform = 'scale(1)';
    }, 200);
}

function simulateOtherUsers() {
    const now = Date.now();
    const onlineUsers = getOnlineUsers();
    if (Math.random() < 0.3) {
        const newUserId = 'user_' + Math.random().toString(36).substr(2, 9) + '_' + now;
        onlineUsers.push({ id: newUserId, lastSeen: now - Math.random() * 2 * 60 * 1000 });
    }
    const activeUsers = onlineUsers.filter(user => (now - user.lastSeen) < 5 * 60 * 1000);
    saveOnlineUsers(activeUsers);
}

export function initOnlineUsers(onlineCountEl) {
    const userId = 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    updateOnlineCount(userId, onlineCountEl);
    setInterval(() => updateOnlineCount(userId, onlineCountEl), 7000);
    setInterval(simulateOtherUsers, 15000);
} 