import { describe, it, expect } from 'vitest';
import { performMove } from './gameLogicService';
import type { CombinedGameState } from '$lib/models/gameState';
import { defaultGameSettings } from '$lib/stores/gameSettingsDefaults';
import { initialScoreState } from '$lib/stores/scoreStore';
import { initialUIState } from '$lib/stores/uiStateStore';
// FIX: Імпортуємо типи для явної типізації моків
import type { BoardState } from '$lib/stores/boardStore';
import type { PlayerState } from '$lib/stores/playerStore';

describe('gameLogicService', () => {
    // FIX: Явна типізація BoardState вирішує проблему з moveHistory: [] та moveQueue: []
    const mockBoardState: BoardState = {
        boardSize: 4,
        board: [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
        playerRow: 0,
        playerCol: 0,
        cellVisitCounts: {},
        moveHistory: [],
        moveQueue: []
    };

    // FIX: Явна типізація PlayerState вирішує проблему з type: 'human' та bonusHistory: []
    const mockPlayerState: PlayerState = {
        players: [
            {
                id: 1,
                type: 'human',
                name: 'P1',
                score: 0,
                color: 'red',
                isComputer: false,
                penaltyPoints: 0,
                bonusPoints: 0,
                bonusHistory: []
            },
            {
                id: 2,
                type: 'ai',
                name: 'AI',
                score: 0,
                color: 'blue',
                isComputer: true,
                penaltyPoints: 0,
                bonusPoints: 0,
                bonusHistory: []
            }
        ],
        currentPlayerIndex: 0
    };

    const baseState: CombinedGameState = {
        ...mockBoardState,
        ...mockPlayerState,
        ...initialScoreState,
        ...initialUIState
    };

    it('should perform a valid move successfully', () => {
        const result = performMove(
            'down',
            1,
            0,
            baseState,
            defaultGameSettings,
            'training'
        );

        expect(result.success).toBe(true);
        expect(result.newPosition).toEqual({ row: 1, col: 0 });
        // @ts-ignore - перевіряємо наявність змін
        expect(result.changes?.boardState.playerRow).toBe(1);
    });

    it('should fail when moving out of bounds', () => {
        const result = performMove(
            'up', // Already at 0,0
            1,
            0,
            baseState,
            defaultGameSettings,
            'training'
        );

        expect(result.success).toBe(false);
        expect(result.reason).toBe('out_of_bounds');
    });

    it('should fail when moving to a blocked cell', () => {
        const blockedState: CombinedGameState = {
            ...baseState,
            cellVisitCounts: { '1-0': 2 } // Assume blocked threshold is 1
        };
        const settings = { ...defaultGameSettings, blockModeEnabled: true, blockOnVisitCount: 1 };

        const result = performMove(
            'down',
            1,
            0,
            blockedState,
            settings,
            'training'
        );

        expect(result.success).toBe(false);
        expect(result.reason).toBe('blocked_cell');
    });

    it('should calculate distance bonus correctly', () => {
        const result = performMove(
            'down',
            3,
            0,
            baseState,
            defaultGameSettings,
            'training'
        );

        expect(result.success).toBe(true);
        // Distance 3 > 1, so bonus should be 1
        expect(result.bonusPoints).toBe(1);
    });
});