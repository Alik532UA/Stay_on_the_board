
import { writable } from 'svelte/store';

type VoiceControlState = {
  lastTranscript: string;
};

function createVoiceControlStore() {
  const { subscribe, set, update } = writable<VoiceControlState>({
    lastTranscript: '',
  });

  return {
    subscribe,
    setTranscript: (transcript: string) => {
      update(state => ({ ...state, lastTranscript: transcript }));
    },
    reset: () => {
      set({ lastTranscript: '' });
    }
  };
}

export const voiceControlStore = createVoiceControlStore();
