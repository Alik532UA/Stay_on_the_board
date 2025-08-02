export type DirectionKey = 'up-left' | 'up' | 'up-right' | 'left' | 'right' | 'down-left' | 'down' | 'down-right';

export interface CenterInfoProps {
  class: string;
  content: string;
  clickable: boolean;
  aria: string;
}

const directionArrows: Record<DirectionKey, string> = {
  'up-left': '↖',
  'up': '↑',
  'up-right': '↗',
  'left': '←',
  'right': '→',
  'down-left': '↙',
  'down': '↓',
  'down-right': '↘',
};

export function getCenterInfoState({
  selectedDirection,
  selectedDistance,
  lastComputerMove,
  isPlayerTurn,
  isPauseBetweenMoves = false
}: {
  selectedDirection: DirectionKey | null;
  selectedDistance: number | null;
  lastComputerMove?: { direction?: DirectionKey; distance?: number } | null;
  isPlayerTurn: boolean;
  isPauseBetweenMoves?: boolean;
}): CenterInfoProps {
  console.log('[centerInfoUtil] getCenterInfoState викликано:', {
    selectedDirection,
    selectedDistance,
    lastComputerMove,
    isPlayerTurn,
    isPauseBetweenMoves
  });
  
  // Якщо є вибраний хід - показуємо його
  if (selectedDirection && selectedDistance) {
    let dir = '';
    if (directionArrows[selectedDirection]) {
      dir = directionArrows[selectedDirection];
    }
    console.log('[centerInfoUtil] Показуємо підтверджуваний хід:', `${dir}${selectedDistance}`);
    return {
      class: 'confirm-btn-active',
      content: `${dir}${selectedDistance}`,
      clickable: isPlayerTurn,
      aria: `Підтвердити хід: ${dir}${selectedDistance}`
    };
  }
  
  // Якщо є тільки напрямок
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
  
  // Якщо є тільки відстань
  if (!selectedDirection && selectedDistance) {
    return {
      class: 'direction-distance-state',
      content: String(selectedDistance),
      clickable: false,
      aria: `Вибрано відстань: ${selectedDistance}`
    };
  }
  
  // Якщо немає вибраного ходу і є хід комп'ютера
  if (!selectedDirection && !selectedDistance && lastComputerMove) {
    // Якщо зараз пауза між ходами - приховуємо хід комп'ютера
    if (isPauseBetweenMoves) {
      console.log('[centerInfoUtil] Приховуємо хід комп\'ютера під час паузи');
      return { class: '', content: '', clickable: false, aria: 'Пауза між ходами' };
    }
    
    // Інакше показуємо хід комп'ютера
    let dir = '';
    let dist = '';
    if (lastComputerMove.direction && directionArrows[lastComputerMove.direction]) {
      dir = directionArrows[lastComputerMove.direction];
    }
    if (typeof lastComputerMove.distance === 'number') {
      dist = String(lastComputerMove.distance);
    }
    console.log('[centerInfoUtil] Показуємо хід комп\'ютера:', `${dir}${dist}`);
    return {
      class: 'computer-move-display',
      content: `${dir}${dist}`,
      clickable: false,
      aria: `Хід комп'ютера: ${dir}${dist}`
    };
  }
  
  // Якщо немає нічого
  if (!selectedDirection && !selectedDistance && !lastComputerMove) {
    return { class: '', content: '', clickable: false, aria: 'Порожньо' };
  }
  
  return { class: '', content: '', clickable: false, aria: '' };
} 