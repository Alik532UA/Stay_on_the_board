import { logService } from '$lib/services/logService';

const directionArrows: Record<any, string> = {
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
  lastPlayerMove,
  isPlayerTurn,
  isPauseBetweenMoves = false,
  previousPlayerColor = null
}: {
  selectedDirection: any | null;
  selectedDistance: number | null;
  lastComputerMove?: { direction?: any; distance?: number } | null;
  lastPlayerMove?: { direction?: any; distance?: number } | null;
  isPlayerTurn: boolean;
  isPauseBetweenMoves?: boolean;
  previousPlayerColor?: string | null;
}): any {
  // НАВІЩО: Додано логування для відладки стану центральної кнопки.
  // Це допоможе швидко діагностувати проблеми з її відображенням у майбутньому.
  logService.ui('[centerInfoUtil] Calculating state', {
    selectedDirection,
    selectedDistance,
    lastComputerMove,
    lastPlayerMove,
    isPlayerTurn,
    isPauseBetweenMoves
  });

  // Якщо є вибраний хід - показуємо його
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
    // if (isPauseBetweenMoves) {
    //   return { class: '', content: '', clickable: false, aria: 'Пауза між ходами' };
    // }
    
    let dir = '';
    let dist = '';
    if (lastComputerMove.direction && directionArrows[lastComputerMove.direction]) {
      dir = directionArrows[lastComputerMove.direction];
    }
    if (typeof lastComputerMove.distance === 'number') {
      dist = String(lastComputerMove.distance);
    }
    // ВАЖЛИВО: Не змінюйте порядок dir та dist. Це зламає інтерфейс.
    return {
      class: 'computer-move-display',
      content: `${dir}${dist}`,
      clickable: false,
      aria: `Хід комп'ютера: ${dir}${dist}`
    };
  }
  
  // Якщо немає вибраного ходу і є останній хід гравця (для локальних ігор)
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
      backgroundColor: previousPlayerColor || '#43a047' // Використовуємо колір гравця або зелений за замовчуванням
    };
  }
  
  // Якщо немає нічого
  if (!selectedDirection && !selectedDistance && !lastComputerMove && !lastPlayerMove) {
    return { class: '', content: '', clickable: false, aria: 'Порожньо' };
  }
  
  return { class: '', content: '', clickable: false, aria: '' };
}