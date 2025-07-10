// localization.js — локалізація

export let currentLang = localStorage.getItem('lang') || 'en';
export let translations = window.translationsAll[currentLang];

export function t(path) {
    return path.split('.').reduce((obj, key) => obj && obj[key], translations) || path;
}

export function loadLanguage(lang, updateUIWithLanguage) {
    translations = window.translationsAll[lang];
    currentLang = lang;
    localStorage.setItem('lang', lang);
    if (typeof updateUIWithLanguage === 'function') updateUIWithLanguage();
}

export function updateUIWithLanguage(modalOverlay, modalTitle, showMainMenu, t) {
    if (!modalOverlay.classList.contains('hidden') && modalTitle.textContent === t('mainMenu.title')) {
        showMainMenu();
    }
} 