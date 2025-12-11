// speechService.ts: централізований сервіс для озвучення ходів, повідомлень тощо.
import { writable, get } from 'svelte/store';
import { logService } from '$lib/services/logService';
import { gameSettingsStore } from '$lib/stores/gameSettingsStore';
import { playerStore } from '$lib/stores/playerStore';
import type { MoveDirectionType } from '$lib/models/Piece';

// Прямий імпорт усіх необхідних перекладів
import ukTranslations from '$lib/i18n/uk/speech.js';
import enTranslations from '$lib/i18n/en/speech.js';
import crhTranslations from '$lib/i18n/crh/speech.js';
import nlTranslations from '$lib/i18n/nl/speech.js';

// Типи для перекладів озвучення
interface SpeechTranslations {
    directions: Record<MoveDirectionType, string>;
    testPhrase: string;
}

type SupportedLanguage = 'uk' | 'en' | 'crh' | 'nl';

const speechTranslations: Record<SupportedLanguage, SpeechTranslations> = {
    uk: ukTranslations as SpeechTranslations,
    en: enTranslations as SpeechTranslations,
    crh: crhTranslations as SpeechTranslations,
    nl: nlTranslations as SpeechTranslations
};

// Типи для голосів
type PreferredDialects = Record<SupportedLanguage, string>;

const voices = writable<SpeechSynthesisVoice[]>([]);
let voicesPromise: Promise<SpeechSynthesisVoice[]> | null = null;

/**
 * Завантажує та повертає список доступних голосів.
 */
export function loadAndGetVoices(): Promise<SpeechSynthesisVoice[]> {
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
            voices.set(allVoices);
            return resolve(allVoices);
        }
        speechSynthesis.onvoiceschanged = () => {
            const updatedVoices = speechSynthesis.getVoices();
            logService.ui(`[Speech] 'voiceschanged' event fired. Loaded ${updatedVoices.length} voices.`);
            voices.set(updatedVoices);
            resolve(updatedVoices);
        };
        setTimeout(() => {
            const finalCheckVoices = speechSynthesis.getVoices();
            if (finalCheckVoices.length) {
                logService.ui(`[Speech] Fallback check loaded ${finalCheckVoices.length} voices.`);
                voices.set(finalCheckVoices);
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
export function resetVoicesPromise(): void {
    voicesPromise = null;
}

// Ініціюємо завантаження при першому імпорті файлу
loadAndGetVoices();

/**
 * Фільтрує голоси за кодом мови (напр., 'uk' або 'en').
 */
export function filterVoicesByLang(voiceList: SpeechSynthesisVoice[], langCode: string): SpeechSynthesisVoice[] {
    if (!voiceList) return [];

    const preferredDialects: PreferredDialects = {
        nl: 'nl-NL',
        en: 'en-US',
        uk: 'uk-UA',
        crh: 'crh-UA'
    };

    const preferredLang = preferredDialects[langCode as SupportedLanguage];

    logService.ui(`[Speech] Filtering for langCode: "${langCode}". Preferred dialect: "${preferredLang}". Total voices: ${voiceList.length}`);

    if (preferredLang) {
        const preferredVoices = voiceList.filter(voice => voice.lang.replace('_', '-') === preferredLang);
        if (preferredVoices.length > 0) {
            logService.ui(`[Speech] Found ${preferredVoices.length} voices with preferred dialect "${preferredLang}".`);
            return preferredVoices;
        }
    }

    // Fallback to matching the base language code
    const filtered = voiceList.filter(voice => voice.lang.split(/[-_]/)[0].toLowerCase() === langCode);
    logService.ui(`[Speech] No preferred dialect found. Found ${filtered.length} voices matching base lang "${langCode}".`);
    return filtered;
}

// Тип для об'єкта ходу
interface MoveData {
    direction: MoveDirectionType;
    distance: number;
}

/**
 * Озвучує ігровий хід.
 * @param force - Якщо true, ігнорує внутрішні перевірки налаштувань (speechFor), 
 *                покладаючись на те, що викликаючий код вже все перевірив.
 *                Але все ще поважає глобальний speechEnabled.
 */
export function speakMove(
    move: MoveData,
    lang: string,
    voiceURI: string | null,
    onEndCallback?: () => void,
    force: boolean = false
): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || !move) {
        if (onEndCallback) onEndCallback();
        return;
    }

    const settings = get(gameSettingsStore);

    // Глобальний перемикач має пріоритет
    if (!settings.speechEnabled) {
        logService.speech('[Speech] speakMove: Speech is globally disabled.');
        if (onEndCallback) setTimeout(() => onEndCallback(), 100);
        return;
    }

    let shouldSpeak = false;

    if (force) {
        // Якщо force=true, ми довіряємо тому, хто викликав функцію
        shouldSpeak = true;
        logService.speech('[Speech] speakMove: Forced speech (settings checks bypassed).');
    } else {
        // Стара логіка для зворотної сумісності (якщо викликається без force)
        const playerState = get(playerStore);
        if (playerState) {
            const currentPlayer = playerState.players[playerState.currentPlayerIndex];
            shouldSpeak = currentPlayer &&
                (currentPlayer.isComputer ? settings.speechFor.computer : settings.speechFor.player);
        }
    }

    if (!shouldSpeak) {
        logService.speech('[Speech] speakMove: Speech logic determined NOT to speak.');
        if (onEndCallback) {
            setTimeout(() => onEndCallback(), 100);
        }
        return;
    }

    const allVoices = speechSynthesis.getVoices();
    if (allVoices.length === 0) {
        logService.ui('[Speech] speakMove called, but no voices are available.');
        loadAndGetVoices();
        if (onEndCallback) onEndCallback();
        return;
    }

    const selectedVoice = voiceURI ? allVoices.find(v => v.voiceURI === voiceURI) : null;
    const availableVoices = filterVoicesByLang(allVoices, lang);
    const voiceToUse = selectedVoice || availableVoices[0] || null;

    const voiceLang = voiceToUse ? voiceToUse.lang : 'en-US';
    const actualLangCode = voiceLang.split(/[-_]/)[0].toLowerCase();
    logService.speech(`[Speech] Determined language for speech: ${actualLangCode} (based on voice lang: ${voiceLang})`);

    const translations = (actualLangCode in speechTranslations)
        ? speechTranslations[actualLangCode as SupportedLanguage]
        : speechTranslations['en'];

    const directionText = translations.directions[move.direction] || move.direction;
    const distanceText = String(move.distance);

    let textToSpeak = '';

    if (settings.shortSpeech && move.distance === 1) {
        textToSpeak = directionText;
    } else {
        if (settings.speechOrder === 'dist_dir') {
            textToSpeak = `${distanceText} ${directionText}`;
        } else {
            textToSpeak = `${directionText} ${distanceText}`;
        }
    }

    logService.speech(`[Speech] Generating text for "${actualLangCode}": "${textToSpeak}"`);

    speakText(textToSpeak, voiceLang, voiceURI, onEndCallback);
}

/**
 * Озвучує текст.
 */
export function speakText(
    textToSpeak: string,
    lang: string,
    voiceURI: string | null,
    onEndCallback?: () => void
): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || !textToSpeak) return;

    logService.speech(`[Speech] speakText called. Current speaking state: ${window.speechSynthesis.speaking}. Queued text: "${textToSpeak}"`);

    const allVoices = speechSynthesis.getVoices();
    if (allVoices.length === 0) {
        logService.speech('[Speech] No voices available, aborting speakText.');
        loadAndGetVoices();
        return;
    }

    const settings = get(gameSettingsStore);
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = settings.speechRate || 1.0;
    utterance.pitch = 1.0;
    logService.speech(`[Speech] Applying speechRate in speakText: ${utterance.rate}`);

    if (onEndCallback) {
        utterance.onend = onEndCallback;
    }

    const voiceToUseURI = voiceURI || settings.selectedVoiceURI;
    let selectedVoice: SpeechSynthesisVoice | null = null;

    if (voiceToUseURI) {
        selectedVoice = allVoices.find(v => v.voiceURI === voiceToUseURI) || null;
        if (selectedVoice) {
            utterance.voice = selectedVoice;
            utterance.lang = selectedVoice.lang;
            logService.speech(`[Speech] Found and set requested voice: ${selectedVoice.name}`);
        } else {
            logService.speech(`[Speech] Voice with URI "${voiceToUseURI}" not found. Using default for lang "${lang}".`);
            utterance.lang = lang;
        }
    } else {
        utterance.lang = lang;
    }

    logService.speech(`[Speech] Cancelling previous speech and queuing utterance "${textToSpeak}" with lang: ${utterance.lang}`);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    logService.speech(`[Speech] Utterance queued. Current speaking state: ${window.speechSynthesis.speaking}.`);
}

/**
 * Озвучує тестову фразу.
 */
export function speakTestPhrase(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const settings = get(gameSettingsStore);
    const allVoices = speechSynthesis.getVoices();
    if (allVoices.length === 0) {
        logService.ui('[Speech] speakTestPhrase called, but no voices are available.');
        loadAndGetVoices();
        return;
    }

    let voiceToUse: SpeechSynthesisVoice | null = null;
    if (settings.selectedVoiceURI) {
        voiceToUse = allVoices.find(v => v.voiceURI === settings.selectedVoiceURI) || null;
    }

    // Fallback to the first available voice if none is selected or found
    if (!voiceToUse && allVoices.length > 0) {
        voiceToUse = allVoices[0];
    }

    if (!voiceToUse) {
        logService.speech('[Speech] No voice available to determine language for test phrase.');
        return;
    }

    const voiceLang = voiceToUse.lang;
    const langCode = voiceLang.split(/[-_]/)[0].toLowerCase();

    const translations = (langCode in speechTranslations)
        ? speechTranslations[langCode as SupportedLanguage]
        : speechTranslations['en'];

    const phrase = translations.testPhrase;

    if (!phrase) {
        logService.error(`[Speech] No test phrase found for langCode: ${langCode}`);
        return;
    }

    const utterance = new SpeechSynthesisUtterance(phrase);
    utterance.rate = settings.speechRate || 1.0;
    utterance.pitch = 1.0;
    utterance.voice = voiceToUse;
    utterance.lang = voiceToUse.lang;
    logService.speech(`[Speech] Applying speechRate in speakTestPhrase: ${utterance.rate}`);

    logService.speech(`[Speech] Cancelling previous speech and queuing test utterance "${phrase}" with lang: ${utterance.lang}`);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
}