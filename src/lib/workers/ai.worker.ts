// src/lib/workers/ai.worker.ts
import { calculateAvailableMoves } from '../services/availableMovesService';

self.onmessage = (e: MessageEvent) => {
  const { boardState, playerState, settings } = e.data;
  
  // Розрахунок доступних ходів (чиста функція)
  const availableMoves = calculateAvailableMoves(boardState, playerState, settings);

  if (availableMoves.length === 0) {
    self.postMessage(null);
    return;
  }

  // Поки що просто випадковий хід
  const randomIndex = Math.floor(Math.random() * availableMoves.length);
  const randomMove = availableMoves[randomIndex];

  // Можна додати невелику затримку для реалістичності "думки" ШІ
  // або для того, щоб UI встиг оновитися
  self.postMessage(randomMove);
};
