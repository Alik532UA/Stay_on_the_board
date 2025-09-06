import { writable, get } from 'svelte/store';
import { loadAndGetVoices, filterVoicesByLang } from '$lib/services/speechService.js';
import { locale } from 'svelte-i18n';
import { logService } from '$lib/services/logService.js';
import { gameSettingsStore } from './gameSettingsStore.ts';

export const availableVoices = writable([]);
export const isLoading = writable(true);

export async function initializeVoices() {
    isLoading.set(true);
    const currentLocale = get(locale) || 'uk';
    try {
        const allVoices = await loadAndGetVoices();
        let mainVoices = filterVoicesByLang(allVoices, currentLocale);
        if (currentLocale !== 'en') {
            const enVoices = filterVoicesByLang(allVoices, 'en');
            const mainVoiceURIs = new Set(mainVoices.map(v => v.voiceURI));
            const onlyEn = enVoices.filter(v => !mainVoiceURIs.has(v.voiceURI));
            availableVoices.set([...mainVoices, ...onlyEn]);
        } else {
            availableVoices.set(mainVoices);
        }
    } catch (error) {
        logService.ui("Помилка завантаження голосів:", error);
        availableVoices.set([]);
    }

    const settings = get(gameSettingsStore);
    const voices = get(availableVoices);

    if (!settings.selectedVoiceURI && voices.length > 0) {
        gameSettingsStore.updateSettings({ selectedVoiceURI: voices[0].voiceURI });
        logService.ui(`Default voice automatically selected: ${voices[0].name}`);
    }

    isLoading.set(false);
}