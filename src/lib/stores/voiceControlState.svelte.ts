// src/lib/stores/voiceControlState.svelte.ts
// SSoT для голосового керування. Svelte 5 Runes.

import type { VoiceRecognitionError } from './voiceControlStore';

interface VoiceControlState {
    lastTranscript: string;
    volume: number;
    recognitionError: VoiceRecognitionError | Error | null;
}

class VoiceControlStateRune {
    private _state = $state<VoiceControlState>({
        lastTranscript: '',
        volume: 0,
        recognitionError: null,
    });

    get state() { return this._state; }
    set state(value: VoiceControlState) { this._state = value; }

    setTranscript(transcript: string) {
        this._state = { ...this._state, lastTranscript: transcript, recognitionError: null };
    }

    setVolume(volume: number) {
        this._state = { ...this._state, volume };
    }

    setError(error: VoiceRecognitionError | Error | null) {
        this._state = { ...this._state, recognitionError: error };
    }

    reset() {
        this._state = { lastTranscript: '', volume: 0, recognitionError: null };
    }
}

export const voiceControlState = new VoiceControlStateRune();
