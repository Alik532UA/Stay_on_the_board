// localization.js — локалізація

export let currentLang = localStorage.getItem('lang') || 'uk';
export let translations = window.translationsAll[currentLang];

export function t(path, params) {
  const translations = window.translations;
  let value = path.split('.').reduce((obj, key) => obj && obj[key], translations);
  if (!value) {
    console.warn('[i18n] No translation for', path, 'in', translations);
    return `[no translation: ${path}]`;
  }
  // Якщо передані параметри для підстановки
  if (params && typeof params === 'object') {
    Object.keys(params).forEach(key => {
      // Підміняємо всі входження {key} на значення
      value = value.replace(new RegExp('\\{' + key + '\\}', 'g'), params[key]);
    });
  }
  return value;
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