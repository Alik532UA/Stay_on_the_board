

import { writable } from 'svelte/store';
import { voiceControlState } from './voiceControlState.svelte';

/**
 * Тип помилки розпізнавання мовлення
 */
export interface VoiceRecognitionError {
  error: string;
  message?: string;
}

function createVoiceControlStore() {
  const { subscribe, set: svelteSet } = writable(voiceControlState.state);

  const syncStore = () => { svelteSet(voiceControlState.state); };

  return {
    subscribe,
    setTranscript: (transcript: string) => {
      voiceControlState.setTranscript(transcript);
      syncStore();
    },
    setVolume: (volume: number) => {
      voiceControlState.setVolume(volume);
      syncStore();
    },
    setError: (error: VoiceRecognitionError | Error | null) => {
      voiceControlState.setError(error);
      syncStore();
    },
    reset: () => {
      voiceControlState.reset();
      syncStore();
    }
  };
}

export const voiceControlStore = createVoiceControlStore();

