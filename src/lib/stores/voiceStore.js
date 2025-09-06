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

        if (currentLocale === 'nl') {
            mainVoices.sort((a, b) => {
                if (a.lang === 'nl-NL' && b.lang !== 'nl-NL') return -1;
                if (a.lang !== 'nl-NL' && b.lang === 'nl-NL') return 1;
                return a.name.localeCompare(b.name);
            });
        }

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

        isLoading.set(false);
}

availableVoices.subscribe(voices => {
    // Ensure we have a non-empty array to avoid errors
    if (Array.isArray(voices) && voices.length > 0) {
        const settings = get(gameSettingsStore);
        // Only set the default if one isn't already set.
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