import { logService } from '$lib/services/logService';
import type { MoveDirectionType } from '$lib/models/Piece';

const directionArrows: Record<MoveDirectionType, string> = {
  'up-left': '↖',
  'up': '↑',
  'up-right': '↗',
  'left': '←',
  'right': '→',
  'down-left': '↙',
  'down': '↓',
  'down-right': '↘',
};

/**
 * Стан центральної інформаційної кнопки
 */
export interface CenterInfoState {
  class: string;
  content: string;
  clickable: boolean;
  aria: string;
  backgroundColor?: string;
}

export function getCenterInfoState({
  selectedDirection,
  selectedDistance,
  lastComputerMove,
  lastPlayerMove,
  isPlayerTurn,
  previousPlayerColor = null
}: {
  selectedDirection: MoveDirectionType | null;
  selectedDistance: number | null;
  lastComputerMove?: { direction?: MoveDirectionType; distance?: number } | null;
  lastPlayerMove?: { direction?: MoveDirectionType; distance?: number } | null;
  isPlayerTurn: boolean;
  previousPlayerColor?: string | null;
}): CenterInfoState {
  // FIX: Видалено залежність від isPauseBetweenMoves.
  // Логіка гри оновлюється миттєво, тому UI повинен відображати стан негайно.

  logService.ui('[centerInfoUtil] Calculating state', {
    selectedDirection,
    selectedDistance,
    lastComputerMove,
    lastPlayerMove,
    isPlayerTurn
  });

  // 1. Якщо гравець вибрав хід (напрямок + відстань) - показуємо кнопку підтвердження
  if (selectedDirection && selectedDistance) {
    let dir = '';
    if (directionArrows[selectedDirection]) {
      dir = directionArrows[selectedDirection];
    }
    return {
      class: 'confirm-btn-active',
      content: `${dir}${selectedDistance}`,
      clickable: isPlayerTurn,
      aria: `Підтвердити хід: ${dir}${selectedDistance}`
    };
  }

  // 2. Якщо вибрано тільки напрямок
  if (selectedDirection) {
    let dir = '';
    if (directionArrows[selectedDirection]) {
      dir = directionArrows[selectedDirection];
    }
    return {
      class: 'direction-distance-state',
      content: dir,
      clickable: false,
      aria: `Вибрано напрямок: ${dir}`
    };
  }

  // 3. Якщо вибрано тільки відстань
  if (!selectedDirection && selectedDistance) {
    return {
      class: 'direction-distance-state',
      content: String(selectedDistance),
      clickable: false,
      aria: `Вибрано відстань: ${selectedDistance}`
    };
  }

  // 4. Якщо немає вибору гравця, показуємо останній хід комп'ютера
  // Це має відбуватися миттєво після оновлення логіки, незалежно від анімації.
  if (!selectedDirection && !selectedDistance && lastComputerMove) {
    let dir = '';
    let dist = '';
    if (lastComputerMove.direction && directionArrows[lastComputerMove.direction]) {
      dir = directionArrows[lastComputerMove.direction];
    }
    if (typeof lastComputerMove.distance === 'number') {
      dist = String(lastComputerMove.distance);
    }
    return {
      class: 'computer-move-display',
      content: `${dir}${dist}`,
      clickable: false,
      aria: `Хід комп'ютера: ${dir}${dist}`
    };
  }

  // 5. Якщо немає ходу комп'ютера, показуємо останній хід гравця (для локальних ігор)
  if (!selectedDirection && !selectedDistance && !lastComputerMove && lastPlayerMove) {
    let dir = '';
    let dist = '';
    if (lastPlayerMove.direction && directionArrows[lastPlayerMove.direction]) {
      dir = directionArrows[lastPlayerMove.direction];
    }
    if (typeof lastPlayerMove.distance === 'number') {
      dist = String(lastPlayerMove.distance);
    }
    return {
      class: 'player-move-display',
      content: `${dir}${dist}`,
      clickable: false,
      aria: `Останній хід гравця: ${dir}${dist}`,
      backgroundColor: previousPlayerColor || '#43a047'
    };
  }

  // 6. Порожній стан
  return { class: '', content: '', clickable: false, aria: 'Порожньо' };
}