

import { writable } from 'svelte/store';

/**
 * Тип помилки розпізнавання мовлення
 */
export interface VoiceRecognitionError {
  error: string;
  message?: string;
}

type VoiceControlState = {
  lastTranscript: string;
  volume: number;
  recognitionError: VoiceRecognitionError | Error | null;
};

function createVoiceControlStore() {
  const { subscribe, set, update } = writable<VoiceControlState>({
    lastTranscript: '',
    volume: 0,
    recognitionError: null,
  });

  return {
    subscribe,
    setTranscript: (transcript: string) => {
      update(state => ({ ...state, lastTranscript: transcript, recognitionError: null }));
    },
    setVolume: (volume: number) => {
      update(state => ({ ...state, volume }));
    },
    setError: (error: VoiceRecognitionError | Error | null) => {
      // Store the full error event object for better debugging
      update(state => ({ ...state, recognitionError: error }));
    },
    reset: () => {
      set({ lastTranscript: '', volume: 0, recognitionError: null });
    }
  };
}

export const voiceControlStore = createVoiceControlStore();

