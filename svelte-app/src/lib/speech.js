// svelte-app/src/lib/speech.js
import { writable, get } from 'svelte/store';
import { logStore } from '$lib/stores/logStore.js';

/** @type {import('svelte/store').Writable<SpeechSynthesisVoice[]>} */
export const voices = writable([]);
/** @type {Promise<SpeechSynthesisVoice[]> | null} */
export let voicesPromise = null;

/**
 * Завантажує та повертає список доступних голосів.
 * Використовує Promise, щоб гарантувати, що голоси завантажені.
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
      logStore.addLog(`[Speech] Voices already loaded: ${allVoices.length}`, 'debug');
      voices.set(/** @type {any} */(allVoices));
      return resolve(allVoices);
    }

    speechSynthesis.onvoiceschanged = () => {
      const updatedVoices = speechSynthesis.getVoices();
      logStore.addLog(`[Speech] 'voiceschanged' event fired. Loaded ${updatedVoices.length} voices.`, 'debug');
      voices.set(/** @type {any} */(updatedVoices));
      resolve(updatedVoices);
    };

    // Запасний механізм для браузерів, де onvoiceschanged спрацьовує нестабільно
    setTimeout(() => {
        const finalCheckVoices = speechSynthesis.getVoices();
        if (finalCheckVoices.length) {
            logStore.addLog(`[Speech] Fallback check loaded ${finalCheckVoices.length} voices.`, 'debug');
            voices.set(/** @type {any} */(finalCheckVoices));
            resolve(finalCheckVoices);
        } else {
            logStore.addLog('[Speech] No voices loaded after fallback.', 'warn');
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
  logStore.addLog(`[Speech] Filtering for langCode: "${langCode}". Total voices: ${voiceList.length}`, 'debug');
  const filtered = voiceList.filter(voice => voice.lang.startsWith(langCode));
  logStore.addLog(`[Speech] Found ${filtered.length} voices for "${langCode}".`, 'debug');
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

  // Завжди отримуємо свіжий список голосів, щоб уникнути "stale" об'єктів, особливо на iOS.
  const allVoices = speechSynthesis.getVoices();
  if (allVoices.length === 0) {
      logStore.addLog('[Speech] Speak called, but no voices are available.', 'warn');
      // Спробуємо завантажити їх знову, хоча це може не спрацювати миттєво
      loadAndGetVoices();
      return;
  }

  window.speechSynthesis.cancel(); // Зупиняємо попередні висловлювання

  const utterance = new SpeechSynthesisUtterance(textToSpeak);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  let selectedVoice = null;
  if (voiceURI) {
    selectedVoice = allVoices.find(v => v.voiceURI === voiceURI);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang; // Важливо: використовуємо точну мову голосу
    } else {
      logStore.addLog(`[Speech] Voice with URI "${voiceURI}" not found. Using default for lang "${lang}".`, 'warn');
      utterance.lang = lang;
    }
  } else {
    utterance.lang = lang;
  }

  logStore.addLog(`[Speech] Attempting to speak: "${textToSpeak}"`, 'info');

  // Невеликий таймаут може допомогти на iOS, де синтез іноді не спрацьовує миттєво.
  setTimeout(() => {
    window.speechSynthesis.speak(utterance);
  }, 50);
}

export const langMap = {
  uk: 'uk-UA',
  en: 'en-US',
  crh: 'crh-UA', // Note: This is not a standard code, TTS might not support it.
  nl: 'nl-NL'
}; 