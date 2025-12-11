import { writable } from 'svelte/store';
import { logService } from '$lib/services/logService';

// Типи для голосів
type SupportedLanguage = 'uk' | 'en' | 'crh' | 'nl';
type PreferredDialects = Record<SupportedLanguage, string>;

let voicesPromise: Promise<SpeechSynthesisVoice[]> | null = null;

export class VoiceLoader {
    /**
     * Завантажує та повертає список доступних голосів.
     */
    static loadAndGetVoices(voicesStore: { set: (v: SpeechSynthesisVoice[]) => void }): Promise<SpeechSynthesisVoice[]> {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
            return Promise.resolve([]);
        }
        if (voicesPromise) {
            return voicesPromise;
        }
        voicesPromise = new Promise((resolve) => {
            const allVoices = speechSynthesis.getVoices();
            if (allVoices.length) {
                logService.ui(`[VoiceLoader] Voices already loaded: ${allVoices.length}`);
                voicesStore.set(allVoices);
                return resolve(allVoices);
            }
            speechSynthesis.onvoiceschanged = () => {
                const updatedVoices = speechSynthesis.getVoices();
                logService.ui(`[VoiceLoader] 'voiceschanged' event fired. Loaded ${updatedVoices.length} voices.`);
                voicesStore.set(updatedVoices);
                resolve(updatedVoices);
            };
            setTimeout(() => {
                const finalCheckVoices = speechSynthesis.getVoices();
                if (finalCheckVoices.length) {
                    logService.ui(`[VoiceLoader] Fallback check loaded ${finalCheckVoices.length} voices.`);
                    voicesStore.set(finalCheckVoices);
                    resolve(finalCheckVoices);
                } else {
                    logService.ui('[VoiceLoader] No voices loaded after fallback.');
                    resolve([]);
                }
            }, 1000);
        });
        return voicesPromise;
    }

    static resetCache() {
        voicesPromise = null;
    }

    /**
     * Фільтрує голоси за кодом мови.
     */
    static filterVoicesByLang(voiceList: SpeechSynthesisVoice[], langCode: string): SpeechSynthesisVoice[] {
        if (!voiceList) return [];

        const preferredDialects: PreferredDialects = {
            nl: 'nl-NL',
            en: 'en-US',
            uk: 'uk-UA',
            crh: 'crh-UA'
        };

        const preferredLang = preferredDialects[langCode as SupportedLanguage];

        logService.ui(`[VoiceLoader] Filtering for langCode: "${langCode}". Preferred dialect: "${preferredLang}". Total voices: ${voiceList.length}`);

        if (preferredLang) {
            const preferredVoices = voiceList.filter(voice => voice.lang.replace('_', '-') === preferredLang);
            if (preferredVoices.length > 0) {
                logService.ui(`[VoiceLoader] Found ${preferredVoices.length} voices with preferred dialect "${preferredLang}".`);
                return preferredVoices;
            }
        }

        // Fallback to matching the base language code
        const filtered = voiceList.filter(voice => voice.lang.split(/[-_]/)[0].toLowerCase() === langCode);
        logService.ui(`[VoiceLoader] No preferred dialect found. Found ${filtered.length} voices matching base lang "${langCode}".`);
        return filtered;
    }
}