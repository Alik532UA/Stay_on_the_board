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
    // Оновлюємо глобальний об'єкт перекладів, щоб інші модулі одразу бачили зміни
    window.translations = window.translationsAll[lang] || {};
    translations = window.translations; // синхронізуємо локальну змінну модуля
    currentLang = lang;
    localStorage.setItem('lang', lang);
    // Якщо передано колбек для оновлення UI – викликаємо його, але безпечним чином
    if (typeof updateUIWithLanguage === 'function') {
        try {
            updateUIWithLanguage();
        } catch (e) {
            console.warn('[i18n] updateUIWithLanguage error:', e);
        }
    }
}

export function updateUIWithLanguage(modalOverlay, modalTitle, showMainMenu, t) {
    // Якщо параметри не передані – просто виходимо
    if (!modalOverlay || !modalTitle || !t) return;
    if (!modalOverlay.classList.contains('hidden') && modalTitle.textContent === t('mainMenu.title')) {
        showMainMenu();
    }
} 