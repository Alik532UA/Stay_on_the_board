
import type { MoveDirectionType } from '$lib/models/Piece';

export interface VoiceCommandResult {
    type: 'move' | 'no-moves' | 'unknown';
    direction?: MoveDirectionType;
    distance?: number;
}

export class VoiceCommandParser {
    private readonly noMovesPhrases: { [key: string]: string[] } = {
        uk: ["ходів немає", "ходів нема", "немає ходів", "нема ходів", "все", "кінець"],
        en: ["no moves", "no move"],
        crh: [],
        nl: []
    };

    private readonly directionRegex: { [key: string]: { [key: string]: RegExp } } = {
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

    private readonly numbers: { [key: string]: { [key: string]: number } } = {
        uk: {
            'один': 1, 'два': 2, 'три': 3, 'чотири': 4, 'п\'ять': 5, 'шість': 6, 'сім': 7, 'вісім': 8,
        },
        en: {
            'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'seven': 7, 'eight': 8,
        },
        crh: {},
        nl: {}
    };

    private readonly diagonalKeywords: { [key: string]: string[] } = {
        uk: ['діагональ', 'діагоналі'],
        en: ['diagonal', 'diagonally'],
        crh: [],
        nl: []
    };

    public parse(command: string, lang: string): VoiceCommandResult {
        const command_lower = command.toLowerCase();

        // 1. Check "No Moves"
        const current_no_moves = this.noMovesPhrases[lang] || [];
        for (const phrase of current_no_moves) {
            if (command_lower.includes(phrase)) {
                return { type: 'no-moves' };
            }
        }

        let found_direction: string | null = null;
        let found_distance: number | null = null;

        // 2. Check Diagonals
        const isDiagonal = (this.diagonalKeywords[lang] || []).some(keyword => command_lower.includes(keyword));

        if (isDiagonal) {
            const diagonalDirections = {
                'up-left': this.directionRegex[lang]['up-left'],
                'up-right': this.directionRegex[lang]['up-right'],
                'down-left': this.directionRegex[lang]['down-left'],
                'down-right': this.directionRegex[lang]['down-right'],
            };

            for (const dir in diagonalDirections) {
                if (diagonalDirections[dir as keyof typeof diagonalDirections].test(command_lower)) {
                    found_direction = dir;
                    break;
                }
            }
        } else {
            // 3. Check Standard Directions
            const current_directions = this.directionRegex[lang] || {};
            for (const dir in current_directions) {
                if (current_directions[dir].test(command_lower)) {
                    found_direction = dir;
                    break;
                }
            }
        }

        if (found_direction) {
            const current_numbers = this.numbers[lang] || {};
            for (const num_word in current_numbers) {
                if (command_lower.includes(num_word)) {
                    found_distance = current_numbers[num_word];
                    break;
                }
            }

            if (found_distance === null) {
                const match = command_lower.match(/\d+/);
                if (match) {
                    found_distance = parseInt(match[0], 10);
                }
            }

            return {
                type: 'move',
                direction: found_direction as MoveDirectionType,
                distance: found_distance ?? 1
            };
        }

        return { type: 'unknown' };
    }
}

export const voiceCommandParser = new VoiceCommandParser();
