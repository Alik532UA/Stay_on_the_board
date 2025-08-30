// speechService: централізований сервіс для озвучення ходів, повідомлень тощо.
import { writable, get } from 'svelte/store';
import { logService } from '$lib/services/logService.js';
import { _ } from 'svelte-i18n';

// Прямий імпорт усіх необхідних перекладів
import ukTranslations from '$lib/i18n/uk/speech.js';
import enTranslations from '$lib/i18n/en/speech.js';
import crhTranslations from '$lib/i18n/crh/speech.js';
import nlTranslations from '$lib/i18n/nl/speech.js';

const speechTranslations = {
  uk: ukTranslations,
  en: enTranslations,
  crh: crhTranslations,
  nl: nlTranslations
};

/** @type {import('svelte/store').Writable<SpeechSynthesisVoice[]>} */
const voices = writable([]);
/** @type {Promise<SpeechSynthesisVoice[]> | null} */
let voicesPromise = null;

/**
 * Завантажує та повертає список доступних голосів.
 * @returns {Promise<SpeechSynthesisVoice[]>}
 */
export function loadAndGetVoices() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return Promise.resolve([]);
  }
  if (voicesPromise) {
    return voicesPromise;
  }
  voicesPromise = new Promise((resolve) => {
    const allVoices = speechSynthesis.getVoices();
    if (allVoices.length) {
      logService.ui(`[Speech] Voices already loaded: ${allVoices.length}`);
      voices.set(/** @type {any} */(allVoices));
      return resolve(allVoices);
    }
    speechSynthesis.onvoiceschanged = () => {
      const updatedVoices = speechSynthesis.getVoices();
      logService.ui(`[Speech] 'voiceschanged' event fired. Loaded ${updatedVoices.length} voices.`);
      voices.set(/** @type {any} */(updatedVoices));
      resolve(updatedVoices);
    };
    setTimeout(() => {
        const finalCheckVoices = speechSynthesis.getVoices();
        if (finalCheckVoices.length) {
            logService.ui(`[Speech] Fallback check loaded ${finalCheckVoices.length} voices.`);
            voices.set(/** @type {any} */(finalCheckVoices));
            resolve(finalCheckVoices);
        } else {
            logService.ui('[Speech] No voices loaded after fallback.');
            resolve([]);
        }
    }, 1000);
  });
  return voicesPromise;
}

/**
 * Скидає кешований voicesPromise, щоб змусити loadAndGetVoices завантажити голоси заново.
 */
export function resetVoicesPromise() {
  voicesPromise = null;
}

// Ініціюємо завантаження при першому імпорті файлу
loadAndGetVoices();

/**
 * Фільтрує голоси за кодом мови (напр., 'uk' або 'en').
 * @param {SpeechSynthesisVoice[]} voiceList
 * @param {string} langCode
 * @returns {SpeechSynthesisVoice[]}
 */
export function filterVoicesByLang(voiceList, langCode) {
  if (!voiceList) return [];
  logService.ui(`[Speech] Filtering for langCode: "${langCode}". Total voices: ${voiceList.length}`);
  const filtered = voiceList.filter(voice => voice.lang.startsWith(langCode));
  logService.ui(`[Speech] Found ${filtered.length} voices for "${langCode}".`);
  return filtered;
}

/**
 * Озвучує ігровий хід.
 * @param {{direction: import('../models/Figure').MoveDirectionType, distance: number}} move
 * @param {string} lang - Мова інтерфейсу (для вибору голосу)
 * @param {string | null} voiceURI
 */
export function speakMove(move, lang, voiceURI) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window) || !move) return;

  const allVoices = speechSynthesis.getVoices();
  if (allVoices.length === 0) {
    logService.ui('[Speech] speakMove called, but no voices are available.');
    loadAndGetVoices();
    return;
  }

  const selectedVoice = voiceURI ? allVoices.find(v => v.voiceURI === voiceURI) : null;
  const availableVoices = filterVoicesByLang(allVoices, lang);
  let voiceToUse = selectedVoice || availableVoices[0] || null;
  
  const voiceLang = voiceToUse ? voiceToUse.lang : 'en-US';
  const actualLangCode = voiceLang.split('-')[0];
  logService.speech(`[Speech] Determined language for speech: ${actualLangCode} (based on voice lang: ${voiceLang})`);

  // Вибираємо правильний об'єкт перекладів, з фолбеком на англійську
  // Вибираємо правильний об'єкт перекладів, з фолбеком на англійську
const translations = actualLangCode in speechTranslations
  ? speechTranslations[/** @type {keyof typeof speechTranslations} */ (actualLangCode)]
  : speechTranslations['en'];
  
  const directionText = translations.directions[move.direction] || move.direction;
  
  const textToSpeak = `${directionText} ${move.distance}`;
  logService.speech(`[Speech] Generating text for "${actualLangCode}": "${textToSpeak}"`);

  speakText(textToSpeak, voiceLang, voiceURI);
}

/**
 * Озвучує текст.
 * @param {string} textToSpeak
 * @param {string} lang
 * @param {string | null} voiceURI
 */
export function speakText(textToSpeak, lang, voiceURI) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window) || !textToSpeak) return;
  
  logService.speech(`[Speech] speakText called. Current speaking state: ${window.speechSynthesis.speaking}. Queued text: "${textToSpeak}"`);

  const allVoices = speechSynthesis.getVoices();
  if (allVoices.length === 0) {
      logService.speech('[Speech] No voices available, aborting speakText.');
      loadAndGetVoices();
      return;
  }

  const utterance = new SpeechSynthesisUtterance(textToSpeak);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  
  let selectedVoice = null;
  if (voiceURI) {
    selectedVoice = allVoices.find(v => v.voiceURI === voiceURI);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang;
      logService.speech(`[Speech] Found and set requested voice: ${selectedVoice.name}`);
    } else {
      logService.speech(`[Speech] Voice with URI "${voiceURI}" not found. Using default for lang "${lang}".`);
      utterance.lang = lang;
    }
  } else {
    utterance.lang = lang;
  }

  logService.speech(`[Speech] Queuing utterance "${textToSpeak}" with lang: ${utterance.lang}`);
  window.speechSynthesis.speak(utterance);
  logService.speech(`[Speech] Utterance queued. Current speaking state: ${window.speechSynthesis.speaking}.`);
}