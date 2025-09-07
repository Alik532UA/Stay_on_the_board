import { get } from 'svelte/store';
import { uiStateStore } from '$lib/stores/uiStateStore';
import { userActionService } from './userActionService';
import { logService } from './logService';
import { voiceControlStore } from '$lib/stores/voiceControlStore';

class VoiceControlService {
  private recognition: any | null = null;
  private isSupported = false;
  private consecutiveFailedAttempts = 0;
  private readonly MAX_FAILED_ATTEMPTS = 5;

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
    voiceControlStore.setTranscript(transcript);
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
            'up-left': /(вгору|вверх|верх)[\s.,-]*(вліво|ліво|ліва|ліворуч)|(вліво|ліво|ліва|ліворуч)[\s.,-]*(вгору|вверх|верх)/,
            'up-right': /(вгору|вверх|верх)[\s.,-]*(вправо|право|вправа|права|праворуч)|(вправо|право|вправа|права|праворуч)[\s.,-]*(вгору|вверх|верх)/,
            'down-left': /(вниз|низ)[\s.,-]*(вліво|ліво|ліва|ліворуч)|(вліво|ліво|ліва|ліворуч)[\s.,-]*(вниз|низ)/,
            'down-right': /(вниз|низ)[\s.,-]*(вправо|право|вправа|права|праворуч)|(вправо|право|вправа|права|праворуч)[\s.,-]*(вниз|низ)/,
            'up': /в?гору|в?верх|верх/,
            'down': /в?низ|внес/,
            'left': /в?ліво?a?|ліворуч/,
            'right': /в?право?a?|праворуч|вправа/,
        },
        en: {
            'up-left': /up[\s.,-]*left|left[\s.,-]*up/,
            'up-right': /up[\s.,-]*right|right[\s.,-]*up/,
            'down-left': /down[\s.,-]*left|left[\s.,-]*down/,
            'down-right': /down[\s.,-]*right|right[\s.,-]*down/,
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

    const diagonalKeywords: { [key: string]: string[] } = {
        uk: ['діагональ', 'діагоналі'],
        en: ['diagonal', 'diagonally'],
        crh: [],
        nl: []
    };

    const command_lower = command.toLowerCase();
    let found_direction: string | null = null;
    let found_distance: number | null = null;
    let command_parsed = false;

    const current_no_moves = noMovesPhrases[lang] || [];
    for (const phrase of current_no_moves) {
        if (command_lower.includes(phrase)) {
            logService.voiceControl(`[VoiceControlService] Parsed "no moves" command.`);
            userActionService.claimNoMoves();
            command_parsed = true;
            break;
        }
    }

    if (!command_parsed) {
        const isDiagonal = (diagonalKeywords[lang] || []).some(keyword => command_lower.includes(keyword));

        if (isDiagonal) {
            const diagonalDirections = {
                'up-left': directionRegex[lang]['up-left'],
                'up-right': directionRegex[lang]['up-right'],
                'down-left': directionRegex[lang]['down-left'],
                'down-right': directionRegex[lang]['down-right'],
            };

            let foundDiagonalDirection = null;
            for (const dir in diagonalDirections) {
                if (diagonalDirections[dir as keyof typeof diagonalDirections].test(command_lower)) {
                    foundDiagonalDirection = dir;
                    break;
                }
            }

            if (foundDiagonalDirection) {
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

                const distance = found_distance ?? 1;
                logService.voiceControl(`[VoiceControlService] Parsed diagonal command: ${foundDiagonalDirection} ${distance}`);
                uiStateStore.update(s => ({ ...s, voiceMoveRequested: true }));
                logService.voiceControl('[VoiceControlService] voiceMoveRequested set to true');
                userActionService.executeMove(foundDiagonalDirection as any, distance);
                command_parsed = true;
            }
        } else {
            const current_directions = directionRegex[lang] || {};
            for (const dir in current_directions) {
                if (current_directions[dir].test(command_lower)) {
                    found_direction = dir;
                    break;
                }
            }

            if (found_direction) {
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

                const distance = found_distance ?? 1;
                logService.voiceControl(`[VoiceControlService] Parsed command: ${found_direction} ${distance}`);
                uiStateStore.update(s => ({ ...s, voiceMoveRequested: true }));
                logService.voiceControl('[VoiceControlService] voiceMoveRequested set to true');
                userActionService.executeMove(found_direction as any, distance);
                command_parsed = true;
            }
        }
    }

    if (command_parsed) {
        this.consecutiveFailedAttempts = 0;
    } else {
        logService.voiceControl(`[VoiceControlService] Failed to parse command: ${command}`);
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