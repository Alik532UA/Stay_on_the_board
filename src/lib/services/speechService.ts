// speechService.ts: централізований сервіс для озвучення ходів, повідомлень тощо.
import { writable, get } from 'svelte/store';
import { logService } from '$lib/services/logService';
import { gameSettingsStore } from '$lib/stores/gameSettingsStore';
import { playerStore } from '$lib/stores/playerStore';
import type { MoveDirectionType } from '$lib/models/Piece';
import { VoiceLoader } from './speech/voiceLoader';

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

const voices = writable<SpeechSynthesisVoice[]>([]);

// Експортуємо функції-обгортки для зворотної сумісності
export function loadAndGetVoices(): Promise<SpeechSynthesisVoice[]> {
    return VoiceLoader.loadAndGetVoices(voices);
}

export function resetVoicesPromise(): void {
    VoiceLoader.resetCache();
}

export function filterVoicesByLang(voiceList: SpeechSynthesisVoice[], langCode: string): SpeechSynthesisVoice[] {
    return VoiceLoader.filterVoicesByLang(voiceList, langCode);
}

// Ініціюємо завантаження при першому імпорті файлу
loadAndGetVoices();

// Тип для об'єкта ходу
interface MoveData {
    direction: MoveDirectionType;
    distance: number;
}

/**
 * Озвучує ігровий хід.
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

    if (!settings.speechEnabled) {
        logService.speech('[Speech] speakMove: Speech is globally disabled.');
        if (onEndCallback) setTimeout(() => onEndCallback(), 100);
        return;
    }

    let shouldSpeak = false;

    if (force) {
        shouldSpeak = true;
        logService.speech('[Speech] speakMove: Forced speech (settings checks bypassed).');
    } else {
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
        } else {
            utterance.lang = lang;
        }
    } else {
        utterance.lang = lang;
    }

    logService.speech(`[Speech] Queuing utterance "${textToSpeak}"`);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
}

/**
 * Озвучує тестову фразу.
 */
export function speakTestPhrase(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const settings = get(gameSettingsStore);
    const allVoices = speechSynthesis.getVoices();
    if (allVoices.length === 0) {
        loadAndGetVoices();
        return;
    }

    let voiceToUse: SpeechSynthesisVoice | null = null;
    if (settings.selectedVoiceURI) {
        voiceToUse = allVoices.find(v => v.voiceURI === settings.selectedVoiceURI) || null;
    }

    if (!voiceToUse && allVoices.length > 0) {
        voiceToUse = allVoices[0];
    }

    if (!voiceToUse) return;

    const voiceLang = voiceToUse.lang;
    const langCode = voiceLang.split(/[-_]/)[0].toLowerCase();

    const translations = (langCode in speechTranslations)
        ? speechTranslations[langCode as SupportedLanguage]
        : speechTranslations['en'];

    const phrase = translations.testPhrase;

    if (!phrase) return;

    const utterance = new SpeechSynthesisUtterance(phrase);
    utterance.rate = settings.speechRate || 1.0;
    utterance.pitch = 1.0;
    utterance.voice = voiceToUse;
    utterance.lang = voiceToUse.lang;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
}