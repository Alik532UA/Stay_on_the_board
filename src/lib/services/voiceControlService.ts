import { get } from 'svelte/store';
import { uiStateStore } from '$lib/stores/uiStateStore';
import { userActionService } from './userActionService';
import { logService } from './logService';

class VoiceControlService {
  private recognition: any | null = null;
  private isSupported = false;

  constructor() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.isSupported = true;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.lang = 'uk-UA'; // Default language
      this.recognition.interimResults = false;
      this.recognition.maxAlternatives = 1;

      this.recognition.onresult = this.handleResult.bind(this);
      this.recognition.onerror = this.handleError.bind(this);
      this.recognition.onend = this.handleEnd.bind(this);
    }
  }

  public startListening() {
    if (!this.isSupported || get(uiStateStore).isListening) return;
    try {
      this.recognition.start();
      uiStateStore.update(s => ({ ...s, isListening: true }));
      logService.voiceControl('[VoiceControlService] Started listening.');
    } catch (error) {
      logService.voiceControl('[VoiceControlService] Error starting recognition:', error);
    }
  }

  public stopListening() {
    if (!this.isSupported || !get(uiStateStore).isListening) return;
    this.recognition.stop();
    uiStateStore.update(s => ({ ...s, isListening: false }));
    logService.voiceControl('[VoiceControlService] Stopped listening.');
  }

  public toggleListening() {
    if (get(uiStateStore).isListening) {
      this.stopListening();
    } else {
      this.startListening();
    }
  }

  private handleResult(event: any) {
    const transcript = event.results[0][0].transcript.trim();
    logService.voiceControl(`[VoiceControlService] Recognized text: ${transcript}`);
    this.parseCommand(transcript);
  }

  private handleError(event: any) {
    logService.voiceControl(`[VoiceControlService] Speech recognition error: ${event.error}`);
  }

  private handleEnd() {
    uiStateStore.update(s => ({ ...s, isListening: false }));
    logService.voiceControl('[VoiceControlService] Listening ended.');
  }

  private parseCommand(command: string) {
    const lang = this.recognition.lang.split('-')[0] || 'uk';
    logService.voiceControl(`[VoiceControlService] Parsing command with lang: ${lang}`);

    const noMovesPhrases: { [key: string]: string[] } = {
        uk: ["ходів немає", "ходів нема", "немає ходів", "нема ходів", "все", "кінець"],
        en: ["no moves", "no move"],
        crh: [],
        nl: []
    };

    const directionRegex: { [key: string]: { [key: string]: RegExp } } = {
        uk: {
            'up-left': /(вгору|вверх|верх)[ -]вліво/,
            'up-right': /(вгору|вверх|верх)[ -]вправо/,
            'down-left': /вниз[ -]вліво/,
            'down-right': /вниз[ -]вправо/,
            'up': /в?гору|в?верх|верх/,
            'down': /в?низ|внес/,
            'left': /в?ліво?a?|ліворуч/,
            'right': /в?право?a?|праворуч/,
        },
        en: {
            'up-left': /up[ -]?left/,
            'up-right': /up[ -]?right/,
            'down-left': /down[ -]?left/,
            'down-right': /down[ -]?right/,
            'up': /up/,
            'down': /down/,
            'left': /left/,
            'right': /right/,
        },
        crh: {}, 
        nl: {}
    };

    const numbers: { [key: string]: { [key: string]: number } } = {
        uk: {
            'один': 1, 'два': 2, 'три': 3, 'чотири': 4, 'п\'ять': 5, 'шість': 6, 'сім': 7, 'вісім': 8,
        },
        en: {
            'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'seven': 7, 'eight': 8,
        },
        crh: {}, 
        nl: {}
    };

    const command_lower = command.toLowerCase();
    let found_direction: string | null = null;
    let found_distance: number | null = null;

    const current_no_moves = noMovesPhrases[lang] || [];
    for (const phrase of current_no_moves) {
        if (command_lower.includes(phrase)) {
            logService.voiceControl(`[VoiceControlService] Parsed "no moves" command.`);
            userActionService.claimNoMoves();
            return;
        }
    }

    const current_directions = directionRegex[lang] || {};
    for (const dir in current_directions) {
        if (current_directions[dir].test(command_lower)) {
            found_direction = dir;
            break;
        }
    }

    const current_numbers = numbers[lang] || {};
    for (const num_word in current_numbers) {
        if (command_lower.includes(num_word)) {
            found_distance = current_numbers[num_word];
            break;
        }
    }
    
    const match = command_lower.match(/\d+/);
    if (match) {
        found_distance = parseInt(match[0], 10);
    }

    if (found_direction) {
        const distance = found_distance ?? 1;
        logService.voiceControl(`[VoiceControlService] Parsed command: ${found_direction} ${distance}`);
        uiStateStore.update(s => ({ ...s, voiceMoveRequested: true }));
        logService.voiceControl('[VoiceControlService] voiceMoveRequested set to true');
        userActionService.executeMove(found_direction as any, distance);
    } else {
        logService.voiceControl(`[VoiceControlService] Failed to parse command: ${command}`);
    }
  }
}

export const voiceControlService = new VoiceControlService();