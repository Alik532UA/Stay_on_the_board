// src/lib/stores/voiceStore.ts
/**
 * @file Store для керування голосами озвучування.
 */

import { writable, get } from 'svelte/store';
import { loadAndGetVoices, filterVoicesByLang } from '$lib/services/speechService';
import { locale } from 'svelte-i18n';
import { logService } from '$lib/services/logService';
import { gameSettingsStore } from './gameSettingsStore';

/**
 * Тип голосу.
 */
export interface Voice {
    name: string;
    lang: string;
    voiceURI: string;
}

export const availableVoices = writable<Voice[]>([]);
export const isLoading = writable<boolean>(true);

export async function initializeVoices(): Promise<void> {
    isLoading.set(true);
    const currentLocale = get(locale) || 'uk';
    try {
        const allVoices = await loadAndGetVoices();
        let mainVoices = filterVoicesByLang(allVoices, currentLocale);

        if (currentLocale === 'nl') {
            mainVoices.sort((a: Voice, b: Voice) => {
                if (a.lang === 'nl-NL' && b.lang !== 'nl-NL') return -1;
                if (a.lang !== 'nl-NL' && b.lang === 'nl-NL') return 1;
                return a.name.localeCompare(b.name);
            });
        }

        if (currentLocale !== 'en') {
            const enVoices = filterVoicesByLang(allVoices, 'en');
            const mainVoiceURIs = new Set(mainVoices.map((v: Voice) => v.voiceURI));
            const onlyEn = enVoices.filter((v: Voice) => !mainVoiceURIs.has(v.voiceURI));
            availableVoices.set([...mainVoices, ...onlyEn]);
        } else {
            availableVoices.set(mainVoices);
        }
    } catch (error) {
        logService.ui("Помилка завантаження голосів:", error);
        availableVoices.set([]);
    }

    isLoading.set(false);
}

availableVoices.subscribe(voices => {
    if (Array.isArray(voices) && voices.length > 0) {
        const settings = get(gameSettingsStore);
        if (!settings.selectedVoiceURI) {
            gameSettingsStore.updateSettings({ selectedVoiceURI: voices[0].voiceURI });
            logService.ui(`Default voice reactively selected: ${voices[0].name}`);
        }
    }
});

locale.subscribe(newLocale => {
    if (newLocale) {
        logService.ui(`Locale changed to ${newLocale}, re-initializing voices.`);
        initializeVoices();
    }
});
