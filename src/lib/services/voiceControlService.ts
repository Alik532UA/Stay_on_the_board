import { get } from 'svelte/store';
import { uiStateStore } from '$lib/stores/uiStateStore';
import { userActionService } from './userActionService';
import { logService } from './logService';
import { voiceControlStore } from '$lib/stores/voiceControlStore';
import { voiceCommandParser, type VoiceCommandResult } from './voice/VoiceCommandParser';

class VoiceControlService {
  private recognition: SpeechRecognition | null = null;
  private isSupported = false;
  private consecutiveFailedAttempts = 0;
  private readonly MAX_FAILED_ATTEMPTS = 5;
  private processingResult = false; // Flag to prevent restart on manual stop or result

  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStreamSource: MediaStreamAudioSourceNode | null = null;
  private dataArray: Uint8Array | null = null;
  private animationFrameId: number | null = null;

  constructor() {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      this.isSupported = true;
      this.recognition = new SpeechRecognitionAPI();
      this.recognition.continuous = false;
      this.recognition.lang = 'uk-UA'; // Default language
      this.recognition.interimResults = false;
      this.recognition.maxAlternatives = 1;

      this.recognition.onresult = this.handleResult.bind(this);
      this.recognition.onerror = this.handleError.bind(this);
      this.recognition.onend = this.handleEnd.bind(this);
      this.recognition.onstart = this.handleStart.bind(this);
    } else {
      logService.voiceControl('[VoiceControlService] SpeechRecognition API not supported.');
    }
  }

  public get isApiSupported(): boolean {
    return this.isSupported;
  }

  public startListening() {
    if (!this.isSupported) {
      logService.voiceControl('[VoiceControlService] Attempted to start listening, but API is not supported.');
      return;
    }
    if (get(uiStateStore).isListening) {
      logService.voiceControl('[VoiceControlService] Already listening.');
      return;
    }
    try {
      logService.voiceControl('[VoiceControlService] Calling recognition.start()');
      this.processingResult = false; // Reset flag on start
      this.recognition.start();
      // isListening is set to true in handleStart
    } catch (error) {
      logService.voiceControl('[VoiceControlService] Error calling recognition.start():', error);
      voiceControlStore.setError(error);
      uiStateStore.update(s => ({ ...s, isListening: false }));
    }
  }

  public stopListening() {
    if (!this.isSupported || !get(uiStateStore).isListening) return;
    logService.voiceControl('[VoiceControlService] Calling recognition.stop()');
    this.processingResult = true; // Prevent restart on manual stop
    this.recognition.stop();
    // isListening is set to false in handleEnd
  }

  public toggleListening() {
    if (get(uiStateStore).isListening) {
      this.stopListening();
    } else {
      this.startListening();
    }
  }

  private handleStart() {
    uiStateStore.update(s => ({ ...s, isListening: true }));
    logService.voiceControl('[VoiceControlService] Event: recognition started.');
    this.initAudioAnalysis();
  }

  private handleResult(event: SpeechRecognitionEvent) {
    this.processingResult = true; // We are processing a result, don't restart
    voiceControlStore.setError(null); // Clear any previous error
    const transcript = event.results[0][0].transcript.trim();
    voiceControlStore.setTranscript(transcript);
    logService.voiceControl(`[VoiceControlService] Event: result received. Transcript: ${transcript}`);
    this.processTranscript(transcript);
  }

  private handleError(event: SpeechRecognitionErrorEvent) {
    logService.voiceControl(`[VoiceControlService] Event: error. Error event:`, event.error);
    voiceControlStore.setError(event); // Store the full error object
    if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
      this.processingResult = true; // Permanent error, don't restart
    }
    // For 'no-speech', processingResult remains false, so handleEnd will restart it.
  }

  private handleEnd() {
    uiStateStore.update(s => ({ ...s, isListening: false }));
    logService.voiceControl('[VoiceControlService] Event: recognition ended.');
    this.stopAudioAnalysis();

    // If recognition ended without processing a result (e.g., 'no-speech' error or timeout)
    // and it wasn't manually stopped, then restart.
    if (!this.processingResult) {
      logService.voiceControl('[VoiceControlService] Recognition ended unexpectedly, restarting...');
      setTimeout(() => {
        if (!get(uiStateStore).isListening) {
          this.startListening();
        }
      }, 500);
    }
  }

  private async initAudioAnalysis() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      this.mediaStreamSource = this.audioContext.createMediaStreamSource(stream);
      this.mediaStreamSource.connect(this.analyser);
      this.analyser.fftSize = 256;
      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);

      this.updateVolume();
      logService.voiceControl('[VoiceControlService] Audio analysis initialized.');
    } catch (err) {
      logService.voiceControl('[VoiceControlService] Error initializing audio analysis:', err);
      voiceControlStore.setError(err);
      voiceControlStore.setVolume(0);
    }
  }

  private stopAudioAnalysis() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.mediaStreamSource) {
      this.mediaStreamSource.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStreamSource.disconnect();
      this.mediaStreamSource = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.analyser = null;
    this.dataArray = null;
    voiceControlStore.setVolume(0);
    logService.voiceControl('[VoiceControlService] Audio analysis stopped.');
  }

  private updateVolume = () => {
    if (!this.analyser || !this.dataArray) return;

    this.analyser.getByteFrequencyData(this.dataArray as any);
    let sum = 0;
    for (const amplitude of this.dataArray) {
      sum += amplitude * amplitude;
    }
    const volume = Math.sqrt(sum / this.dataArray.length) / 100; // Normalize to a 0-1 range (approx)
    voiceControlStore.setVolume(volume);

    this.animationFrameId = requestAnimationFrame(this.updateVolume);
  }

  private processTranscript(transcript: string) {
    const lang = this.recognition.lang.split('-')[0] || 'uk';
    logService.voiceControl(`[VoiceControlService] Parsing command with lang: ${lang}`);

    const result = voiceCommandParser.parse(transcript, lang);

    if (result.type === 'no-moves') {
      logService.voiceControl(`[VoiceControlService] Parsed "no moves" command.`);
      userActionService.claimNoMoves();
      this.consecutiveFailedAttempts = 0;
    } else if (result.type === 'move' && result.direction) {
      const distance = result.distance ?? 1;
      logService.voiceControl(`[VoiceControlService] Parsed command: ${result.direction} ${distance}`);
      uiStateStore.update(s => ({ ...s, voiceMoveRequested: true }));
      logService.voiceControl('[VoiceControlService] voiceMoveRequested set to true');
      userActionService.executeMove(result.direction, distance);
      this.consecutiveFailedAttempts = 0;
    } else {
      logService.voiceControl(`[VoiceControlService] Failed to parse command: ${transcript}`);
      this.consecutiveFailedAttempts++;
      if (this.consecutiveFailedAttempts < this.MAX_FAILED_ATTEMPTS) {
        logService.voiceControl(`[VoiceControlService] Retrying... (${this.consecutiveFailedAttempts}/${this.MAX_FAILED_ATTEMPTS})`);
        setTimeout(() => this.startListening(), 100);
      } else {
        logService.voiceControl('[VoiceControlService] Max failed attempts reached.');
        this.consecutiveFailedAttempts = 0;
      }
    }
  }
}

export const voiceControlService = new VoiceControlService();
