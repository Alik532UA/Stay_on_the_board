
import { writable } from 'svelte/store';

type VoiceControlState = {
  lastTranscript: string;
  volume: number;
};

function createVoiceControlStore() {
  const { subscribe, set, update } = writable<VoiceControlState>({
    lastTranscript: '',
    volume: 0,
  });

  return {
    subscribe,
    setTranscript: (transcript: string) => {
      update(state => ({ ...state, lastTranscript: transcript }));
    },
    setVolume: (volume: number) => {
      update(state => ({ ...state, volume }));
    },
    reset: () => {
      set({ lastTranscript: '', volume: 0 });
    }
  };
}

export const voiceControlStore = createVoiceControlStore();
