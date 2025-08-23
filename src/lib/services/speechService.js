// speechService: централізований сервіс для озвучення ходів, повідомлень тощо.
import { writable, get } from 'svelte/store';
import { logService } from '$lib/services/logService.js';
import { _ } from 'svelte-i18n';

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
 * @param {{direction: string, distance: number}} move
 * @param {string} lang
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
  /** @type {SpeechSynthesisVoice | null} */
  let voiceToUse = null;
  if (selectedVoice) {
    voiceToUse = selectedVoice;
  } else if (availableVoices.length > 0) {
    voiceToUse = availableVoices[0];
    logService.speech(`[Speech] No selected voice URI. Using first available for lang "${lang}":`, voiceToUse);
  }
  const voiceLang = voiceToUse ? voiceToUse.lang : 'en-US';
  
  const actualLangCode = voiceLang.split('-');
  logService.speech(`[Speech] Determined language for speech: ${actualLangCode} (based on voice lang: ${voiceLang})`);

  let textToSpeak = '';
  const $t = get(_);

  /** @type {Object.<string, string>} */
  const directionsEn = {
    up: 'up',
    down: 'down',
    left: 'left',
    right: 'right',
    upLeft: 'up-left',
    upRight: 'up-right',
    downLeft: 'down-left',
    downRight: 'down-right',
  };

  if (actualLangCode[0] === 'en') {
    const directionKey = move.direction.replace(/-(\w)/g, (_, c) => c.toUpperCase());
    const directionText = directionsEn[directionKey] || move.direction;
    textToSpeak = `${directionText} ${move.distance}`;
    logService.speech(`[Speech] Generating EN text: "${textToSpeak}"`);
  } else {
    const directionKey = move.direction.replace(/-(\w)/g, (_, c) => c.toUpperCase());
    const directionText = $t(`gameBoard.directions.${directionKey}`) || move.direction;
    textToSpeak = `${directionText} ${move.distance}`;
    logService.speech(`[Speech] Generating text for "${actualLangCode}": "${textToSpeak}"`);
  }

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
  const allVoices = speechSynthesis.getVoices();
  if (allVoices.length === 0) {
      logService.ui('[Speech] Speak called, but no voices are available.');
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
      logService.ui(`[Speech] Voice with URI "${voiceURI}" not found. Using default for lang "${lang}".`);
      utterance.lang = lang;
    }
  } else {
    utterance.lang = lang;
  }
  logService.speech(`[Speech] Attempting to speak: "${textToSpeak}" with lang: ${utterance.lang}`);
  setTimeout(() => {
    window.speechSynthesis.speak(utterance);
  }, 50);
}


// TODO: Додати мок-версію для тестування
