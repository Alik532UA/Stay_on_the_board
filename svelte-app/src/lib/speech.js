// svelte-app/src/lib/speech.js
import { get, writable } from 'svelte/store';
import { t } from 'svelte-i18n';
import { logStore } from '$lib/stores/logStore.js';

export const voices = writable([]);
let voicesLoaded = false;

function populateVoiceList() {
  if (typeof speechSynthesis === 'undefined' || voicesLoaded) {
    return;
  }

  const allVoices = speechSynthesis.getVoices();
  if (allVoices.length) {
    console.log('[Speech] Voices loaded:', allVoices.map(v => ({ name: v.name, lang: v.lang, default: v.default })));
    logStore.addLog(`[Speech] Loaded ${allVoices.length} voices.`, 'debug');
    voices.set(allVoices);
    voicesLoaded = true;
    speechSynthesis.onvoiceschanged = null; // Очищаємо, щоб уникнути повторних викликів
  }
}

// Ініціалізація
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  populateVoiceList();

  if (!voicesLoaded) {
    speechSynthesis.onvoiceschanged = populateVoiceList;

    // Запасний механізм для браузерів, де onvoiceschanged спрацьовує нестабільно
    const checkInterval = setInterval(() => {
      if (get(voices).length > 0) {
        voicesLoaded = true;
        clearInterval(checkInterval);
      } else {
        populateVoiceList();
      }
    }, 250);

    setTimeout(() => clearInterval(checkInterval), 3000); // Зупинити перевірку через 3 секунди
  }
}

/**
 * Фільтрує голоси за кодом мови (напр., 'uk' або 'en').
 * @param {string} langCode
 * @returns {SpeechSynthesisVoice[]}
 */
export function getVoicesByLang(langCode) {
  const allVoices = get(voices);
  console.log(`[Speech] Filtering for langCode: "${langCode}". Total voices: ${allVoices.length}`);
  const filtered = allVoices.filter(voice => voice.lang.startsWith(langCode));
  console.log(`[Speech] Found ${filtered.length} voices for "${langCode}".`);
  return filtered;
}

/**
 * Озвучує ігровий хід.
 * @param {'player' | 'computer'} actorKey
 * @param {string} directionKey
 * @param {number} distance
 * @param {string} lang
 * @param {string | null} voiceURI
 */
export function speakMove(actorKey, directionKey, distance, lang, voiceURI) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  const $t = get(t);
  const direction = $t(`speech.directions.${directionKey}`) || directionKey;
  let textToSpeak;
  if (distance === 1) {
    textToSpeak = `${direction}.`;
  } else {
    textToSpeak = `${distance} ${direction}.`;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(textToSpeak);
  utterance.lang = lang;
  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  if (voiceURI) {
    const allVoices = get(voices);
    const selectedVoice = allVoices.find(v => v.voiceURI === voiceURI);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    } else {
      console.warn(`[Speech] Voice with URI "${voiceURI}" not found.`);
    }
  }

  console.log(`[Speech] Speaking: "${textToSpeak}"`, { voice: utterance.voice?.name });
  window.speechSynthesis.speak(utterance);
}

/** @type {import('./types').LangMapType} */
export const langMap = {
  uk: 'uk-UA',
  en: 'en-US',
  crh: 'crh-UA',
  nl: 'nl-NL'
}; 