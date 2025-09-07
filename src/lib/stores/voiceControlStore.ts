
import { writable } from 'svelte/store';

type VoiceControlState = {
  lastTranscript: string;
  volume: number;
  recognitionError: string | null;
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
    setError: (error: any) => {
        const errorMessage = error ? (error.error || 'Unknown error') : null;
        update(state => ({ ...state, recognitionError: errorMessage }));
    },
    reset: () => {
      set({ lastTranscript: '', volume: 0, recognitionError: null });
    }
  };
}

export const voiceControlStore = createVoiceControlStore();
