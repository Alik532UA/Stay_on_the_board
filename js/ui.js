// ui.js — утиліти для роботи з інтерфейсом

import { t } from './localization.js';

// Функції для модальних вікон залишаються, бо це універсальна утиліта
export function showModal(title, bodyHTML, buttons = []) {
    const modalOverlay = document.getElementById('modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const modalFooter = modalOverlay.querySelector('.modal-footer');

    modalTitle.textContent = title;
    modalBody.innerHTML = bodyHTML;
    modalFooter.innerHTML = '';
    buttons.forEach(button => {
        const btn = document.createElement('button');
        btn.textContent = button.text;
        btn.className = `modal-button ${button.class || ''}`;
        btn.onclick = () => {
            hideModal(); // Автоматично ховаємо модалку при кліку на кнопку
            if(button.onClick) button.onClick();
        };
        modalFooter.appendChild(btn);
    });
    modalOverlay.classList.remove('hidden');
    modalOverlay.classList.add('visible');
}

export function hideModal() {
    const modalOverlay = document.getElementById('modal-overlay');
    modalOverlay.classList.remove('visible');
    // Додамо клас для анімації зникнення
    modalOverlay.classList.add('hidden');
}

// Функції для показу конкретних модальних вікон (Правила, Управління)
export function showRules(onBack) {
    showModal(t('rules.title'), `<p>${t('rules.goal')}</p><p><strong>${t('rules.blockedModeTitle')}</strong> ${t('rules.blockedModeDesc')}</p><p><strong>${t('rules.noMovesBtnTitle')}</strong> ${t('rules.noMovesBtnDesc')}</p>`,
        [{ text: t('common.back'), class: "primary", onClick: onBack }]
    );
}

export function showControlsInfo(onBack) {
    showModal(t('controls.title'), `<p>${t('controls.desc')}</p><ul><li><b>${t('controls.arrows')}</b> - ${t('controls.direction')}</li><li><b>${t('controls.numbers')}</b> - ${t('controls.distance')}</li><li><b>${t('controls.confirmBtn')}</b> - ${t('controls.confirmMove')}</li><li><b>${t('controls.noMovesBtn')}</b> - ${t('controls.noMoves')}</li><li><b>${t('controls.hideBoard')}</b> - ${t('controls.memoryMode')}</li><li><b>${t('controls.blockedMode')}</b> - ${t('controls.blockedModeDesc')}</li></ul>`,
        [{ text: t('common.ok'), class: "primary", onClick: onBack }]
    );
}

// Функція вибору розміру дошки (викликає callback з вибраним розміром)
export function showBoardSizeSelection(onSizeSelect, onBack) {
    const body = `<p class="board-size-label">${t('boardSize.select')}</p><div id="board-size-selector" class="board-size-selector"></div>`;
    showModal(t('boardSize.title'), body, [{ text: t('common.backToMenu'), onClick: onBack }]);
    
    setTimeout(() => {
        const selector = document.getElementById('board-size-selector');
        if (!selector) return;
        selector.innerHTML = '';
        for (let i = 2; i <= 9; i++) {
            const button = document.createElement('button');
            button.className = 'modal-button secondary';
            button.textContent = `${i}x${i}`;
            button.onclick = () => {
                hideModal();
                onSizeSelect(i);
            };
            selector.appendChild(button);
        }
    }, 0);
}

// Функція вводу імен гравців
export function showPlayerNameInput(callback) {
    const body = `
        <div class="player-names-container">
            <input type="text" id="player1-name" class="modal-input player-name-input" placeholder="${t('localGame.player1DefaultName')}">
            <input type="text" id="player2-name" class="modal-input player-name-input" placeholder="${t('localGame.player2DefaultName')}">
        </div>`;
    const buttons = [{
        text: t('mainMenu.startGame'),
        class: 'primary',
        onClick: () => {
            const p1 = document.getElementById('player1-name').value || t('localGame.player1DefaultName');
            const p2 = document.getElementById('player2-name').value || t('localGame.player2DefaultName');
            hideModal();
            callback(p1, p2);
        }
    }];
    showModal(t('localGame.enterNames'), body, buttons);
}

// Інші UI утиліти (тема, онлайн користувачі і т.д.) залишаються тут
export function applyBodyBackground() {
    document.body.style.background = getComputedStyle(document.documentElement).getPropertyValue('--bg-primary');
}

export function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const savedStyle = localStorage.getItem('style') || 'classic';
    document.documentElement.setAttribute('data-style', savedStyle);
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
    applyBodyBackground();
}

export function updateThemeButtons() {
    document.getElementById('theme-style-icon').textContent = '🌗';
    updateThemeStyleDropdownActive();
}

export function updateThemeStyleDropdownActive() {
    const currentStyle = localStorage.getItem('style') || 'classic';
    const currentTheme = localStorage.getItem('theme') || 'light';
    document.querySelectorAll('.theme-style-row').forEach(row => {
        const style = row.getAttribute('data-style');
        row.querySelectorAll('.theme-btn').forEach(btn => {
            const btnTheme = btn.getAttribute('data-theme');
            btn.classList.toggle('active', style === currentStyle && btnTheme === currentTheme);
        });
    });
}

export function initOnlineUsers(onlineCountEl) {
    if (!onlineCountEl) return;
    // ... (логіка лічильника онлайн)
}