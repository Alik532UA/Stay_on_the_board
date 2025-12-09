// src/lib/utils/playerFactory.ts
/**
 * @file Фабрика для створення об'єктів гравців.
 * Усуває дублювання логіки ініціалізації гравців у різних GameModes.
 */

import type { Player, BonusHistoryItem } from '$lib/models/player';
import { DEFAULT_PLAYER_NAMES } from '$lib/config/defaultPlayers';
import { getRandomUnusedColor } from '$lib/utils/playerUtils';

/**
 * Базова конфігурація для створення гравця
 */
export interface CreatePlayerOptions {
    id: number;
    name: string;
    type: 'human' | 'computer' | 'ai';
    color?: string;
    isComputer?: boolean;
}

/**
 * Створює гравця з початковими значеннями
 */
export function createPlayer(options: CreatePlayerOptions): Player {
    return {
        id: options.id,
        name: options.name,
        type: options.type,
        color: options.color || '#000000',
        isComputer: options.isComputer ?? (options.type !== 'human'),
        score: 0,
        penaltyPoints: 0,
        bonusPoints: 0,
        bonusHistory: [] as BonusHistoryItem[],
        roundScore: 0
    };
}

/**
 * Створює гравця-людину
 */
export function createHumanPlayer(
    id: number,
    name: string,
    color?: string
): Player {
    return createPlayer({
        id,
        name,
        type: 'human',
        color,
        isComputer: false
    });
}

/**
 * Створює гравця-комп'ютера (AI)
 */
export function createAIPlayer(
    id: number,
    name: string = "Комп'ютер",
    color?: string
): Player {
    return createPlayer({
        id,
        name,
        type: 'ai',
        color,
        isComputer: true
    });
}

/**
 * Скидає рахунок гравця для нової гри
 */
export function resetPlayerScore(player: Player): Player {
    return {
        ...player,
        score: 0,
        penaltyPoints: 0,
        bonusPoints: 0,
        bonusHistory: [] as BonusHistoryItem[],
        roundScore: 0
    };
}

/**
 * Створює стандартних гравців для локальної гри
 * (використовується як fallback при F5 refresh)
 */
export function createDefaultLocalPlayers(): Player[] {
    const usedColors: string[] = [];
    return DEFAULT_PLAYER_NAMES.map((name, index) => {
        const color = getRandomUnusedColor(usedColors);
        usedColors.push(color);
        return createHumanPlayer(index + 1, name, color);
    });
}

/**
 * Створює гравців для режиму Virtual Player (Human vs AI)
 */
export function createVirtualPlayerPlayers(): Player[] {
    return [
        createHumanPlayer(1, 'Гравець', '#000000'),
        createAIPlayer(2, "Комп'ютер", '#ffffff')
    ];
}
/**
 * Створює гравців для режиму Training (Human vs AI, simplified)
 * Currently same as VirtualPlayer but may differ in future configuration
 */
export function createTrainingPlayers(): Player[] {
    return [
        createHumanPlayer(1, 'Гравець', '#000000'),
        createAIPlayer(2, "Комп'ютер", '#ffffff')
    ];
}

/**
 * Створює гравців для режиму Online
 */
export function createOnlinePlayers(): Player[] {
    return [
        createHumanPlayer(1, 'You', '#000000'),
        createHumanPlayer(2, 'Opponent', '#ffffff')
    ];
}

