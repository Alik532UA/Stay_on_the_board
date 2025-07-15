// src/lib/speech.js
import { get } from 'svelte/store';
import { t } from 'svelte-i18n';
import { writable } from 'svelte/store';

// Стор для зберігання доступних голосів
export const voices = writable(/** @type {any[]} */([]));

let voicesLoaded = false;

/**
 * Асинхронно завантажує та кешує список голосів.
 */
function loadVoices() {
  return new Promise((resolve) => {
    if (voicesLoaded) {
      resolve(get(voices));
      return;
    }

    const allVoices = window.speechSynthesis.getVoices();
    if (allVoices.length) {
      voices.set(allVoices);
      voicesLoaded = true;
      resolve(allVoices);
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        const allVoices = window.speechSynthesis.getVoices();
        voices.set(allVoices);
        voicesLoaded = true;
        resolve(allVoices);
      };
    }
  });
}

// Запускаємо завантаження голосів при першому імпорті файлу
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  loadVoices();
}

/**
 * Фільтрує голоси за кодом мови (напр., 'uk' або 'en').
 * @param {string} langCode - 'uk', 'en', etc.
 * @returns {Promise<SpeechSynthesisVoice[]>}
 */
export async function getVoicesByLang(langCode) {
  const allVoices = await loadVoices();
  return allVoices.filter(/** @param {SpeechSynthesisVoice} voice */ (voice) => voice.lang.startsWith(langCode));
}

/**
 * Повертає правильну форму іменника "клітинка" на основі відстані.
 * @param {number} distance
 * @param {function} t - Функція перекладу з svelte-i18n.
 * @returns {string}
 */
function getCellNoun(distance, t) {
  const n = Math.abs(distance) % 100;
  const n1 = n % 10;
  if (n > 10 && n < 20) return t('speech.cells_many');
  if (n1 > 1 && n1 < 5) return t('speech.cells');
  if (n1 === 1) return t('speech.cell');
  return t('speech.cells_many');
}

/**
 * Озвучує ігровий хід.
 * @param {'computer'} actorKey - Ключ для визначення гравця.
 * @param {string} directionKey - Ключ напрямку.
 * @param {number} distance - Відстань ходу.
 * @param {string} lang - Код мови (напр. 'uk-UA').
 * @param {string | null} voiceURI - URI обраного голосу.
 */
export async function speakMove(actorKey, directionKey, distance, lang, voiceURI) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  const $t = get(t);
  const actor = $t(`speech.${actorKey}`);
  const moveVerb = $t('speech.move');
  const direction = $t(`speech.directions.${directionKey}`) || directionKey;
  const onPrep = $t('speech.on');
  const cellNoun = getCellNoun(distance, $t);
  const textToSpeak = `${actor} ${moveVerb} ${direction} ${onPrep} ${distance} ${cellNoun}.`;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(textToSpeak);
  utterance.lang = lang;
  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  // **НОВИЙ КОД: Пошук та встановлення голосу**
  if (voiceURI) {
    const allVoices = await loadVoices();
    const selectedVoice = allVoices.find(/** @param {SpeechSynthesisVoice} v */ (v) => v.voiceURI === voiceURI);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    } else {
      console.warn(`Збережений голос з URI "${voiceURI}" не знайдено.`);
    }
  }

  console.log(`[Speech] Озвучування: "${textToSpeak}"`, { voice: utterance.voice?.name });
  window.speechSynthesis.speak(utterance);
}

/**
 * @typedef {{ [key: string]: string; uk: string; en: string; crh: string; nl: string; }} LangMapType
 */
/** @type {LangMapType} */
export const langMap = {
  uk: 'uk-UA',
  en: 'en-US',
  crh: 'crh-UA',
  nl: 'nl-NL'
}; 