// speechService: централізований сервіс для озвучення ходів, повідомлень тощо.
import { writable, get } from 'svelte/store';
import { logService } from '$lib/services/logService.js';

/** @type {import('svelte/store').Writable<SpeechSynthesisVoice[]>} */
export const voices = writable([]);
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
      logService.addLog(`[Speech] Voices already loaded: ${allVoices.length}`, 'debug');
      voices.set(/** @type {any} */(allVoices));
      return resolve(allVoices);
    }
    speechSynthesis.onvoiceschanged = () => {
      const updatedVoices = speechSynthesis.getVoices();
      logService.addLog(`[Speech] 'voiceschanged' event fired. Loaded ${updatedVoices.length} voices.`, 'debug');
      voices.set(/** @type {any} */(updatedVoices));
      resolve(updatedVoices);
    };
    setTimeout(() => {
        const finalCheckVoices = speechSynthesis.getVoices();
        if (finalCheckVoices.length) {
            logService.addLog(`[Speech] Fallback check loaded ${finalCheckVoices.length} voices.`, 'debug');
            voices.set(/** @type {any} */(finalCheckVoices));
            resolve(finalCheckVoices);
        } else {
            logService.addLog('[Speech] No voices loaded after fallback.', 'warn');
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
  logService.addLog(`[Speech] Filtering for langCode: "${langCode}". Total voices: ${voiceList.length}`, 'debug');
  const filtered = voiceList.filter(voice => voice.lang.startsWith(langCode));
  logService.addLog(`[Speech] Found ${filtered.length} voices for "${langCode}".`, 'debug');
  return filtered;
}

/**
 * Озвучує ігровий хід.
 * @param {string} textToSpeak
 * @param {string} lang
 * @param {string | null} voiceURI
 */
export function speakText(textToSpeak, lang, voiceURI) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window) || !textToSpeak) return;
  const allVoices = speechSynthesis.getVoices();
  if (allVoices.length === 0) {
      logService.addLog('[Speech] Speak called, but no voices are available.', 'warn');
      loadAndGetVoices();
      return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(textToSpeak);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  let selectedVoice = null;
  if (voiceURI) {
    selectedVoice = allVoices.find(v => v.voiceURI === voiceURI);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang;
    } else {
      logService.addLog(`[Speech] Voice with URI "${voiceURI}" not found. Using default for lang "${lang}".`, 'warn');
      utterance.lang = lang;
    }
  } else {
    utterance.lang = lang;
  }
  logService.addLog(`[Speech] Attempting to speak: "${textToSpeak}"`, 'info');
  setTimeout(() => {
    window.speechSynthesis.speak(utterance);
  }, 50);
}

export const langMap = {
  uk: 'uk-UA',
  en: 'en-US',
  crh: 'crh-UA',
  nl: 'nl-NL'
};

// TODO: Додати мок-версію для тестування 