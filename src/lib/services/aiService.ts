// src/lib/services/aiService.ts
import { get } from 'svelte/store';
import { logService } from './logService';
import type { MoveDirectionType } from '../models/Piece';
import type { BoardState } from '$lib/stores/boardStore';
import type { PlayerState } from '$lib/stores/playerStore';
import type { UiState } from '$lib/stores/uiStateStore';
import { gameSettingsStore } from '$lib/stores/gameSettingsStore';

class AiService {
  private worker: Worker | null = null;

  constructor() {
    // Ініціалізуємо воркер тільки в браузері
    if (typeof window !== 'undefined') {
      try {
        // Використовуємо Vite-синтаксис для воркерів
        this.worker = new Worker(new URL('../workers/ai.worker.ts', import.meta.url), {
          type: 'module'
        });
        logService.init('AiService: Web Worker успішно ініціалізовано');
      } catch (error) {
        logService.error('AiService: Помилка ініціалізації Web Worker', error);
      }
    }
  }

  public async getComputerMove(
    boardState: BoardState, 
    playerState: PlayerState, 
    uiState: UiState
  ): Promise<{ direction: MoveDirectionType; distance: number } | null> {
    if (!boardState || !playerState || !uiState) return null;

    logService.testMode('aiService: отримано стан', { boardState, playerState, uiState });

    if (uiState.testModeOverrides?.nextComputerMove) {
      logService.testMode('aiService: виконується ручний хід з testModeOverrides', uiState.testModeOverrides.nextComputerMove);
      return uiState.testModeOverrides.nextComputerMove;
    }

    // Якщо воркер доступний, використовуємо його
    if (this.worker) {
      return new Promise((resolve) => {
        const settings = get(gameSettingsStore);
        
        const handleMessage = (e: MessageEvent) => {
          this.worker?.removeEventListener('message', handleMessage);
          logService.logicVirtualPlayer('getComputerMove (worker): отримано хід', e.data);
          resolve(e.data);
        };

        this.worker?.addEventListener('message', handleMessage);
        
        logService.logicVirtualPlayer('getComputerMove (worker): надсилаю запит у воркер');
        this.worker?.postMessage({
          boardState,
          playerState,
          settings
        });
      });
    }

    // Фолбек на синхронний розрахунок (якщо воркер не завантажився)
    logService.testMode('aiService: воркер недоступний, виконується синхронний випадковий хід');
    const { calculateAvailableMoves } = await import('./availableMovesService');
    const availableMoves = calculateAvailableMoves(boardState, playerState, get(gameSettingsStore));

    if (availableMoves.length === 0) {
      logService.logicVirtualPlayer('getComputerMove: немає доступних ходів');
      return null;
    }

    const randomIndex = Math.floor(Math.random() * availableMoves.length);
    const randomMove = availableMoves[randomIndex];
    
    return randomMove;
  }
}

export const aiService = new AiService();
