/**
 * @file Isolates all "impure" operations, such as navigation,
 * text-to-speech, and interactions with localStorage or window.
 */
import { goto } from '$app/navigation';
import { base } from '$app/paths';
import { speakText } from '$lib/services/speechService.js';
import { get } from 'svelte/store';
import { locale } from 'svelte-i18n';
import { settingsStore } from '$lib/stores/settingsStore';
import { moveDirections } from '$lib/utils/translations';

export const sideEffectService = {
  /**
   * Navigates to the replay page.
   */
  async navigateToReplay(): Promise<void> {
    await goto(`${base}/replay`);
  },

  /**
   * Speaks the given text using the selected voice and language.
   * @param direction - The direction of the move.
   * @param distance - The distance of the move.
   */
  speakMove(direction: string, distance: number): void {
    const settings = get(settingsStore);
    if (!settings.speechEnabled) return;

    const allVoices = window.speechSynthesis.getVoices();
    const selectedVoice = allVoices.find(v => v.voiceURI === settings.selectedVoiceURI);
    const speechLang = selectedVoice ? selectedVoice.lang.split('-')[0] : (get(locale) || 'uk');
    
    const directionKey = direction.replace(/-(\w)/g, (_, c) => c.toUpperCase());
    // @ts-ignore
    const translatedDirection = moveDirections[speechLang][directionKey];
    const textToSpeak = `${translatedDirection} ${distance}`;
    
    speakText(textToSpeak, speechLang, settings.selectedVoiceURI);
  },

  /**
   * Gets the current URL path.
   * @returns The current path.
   */
  getCurrentPath(): string {
    return window.location.pathname;
  }
};