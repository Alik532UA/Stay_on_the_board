import { writable } from 'svelte/store';

const isBrowser = typeof window !== 'undefined';

// Унікальні ідентифікатори для кожного віджета
export const WIDGETS = {
  TOP_ROW: 'game-board-top-row',
  SCORE_PANEL: 'score-panel',
  BOARD_WRAPPER: 'board-bg-wrapper',
  CONTROLS_PANEL: 'game-controls-panel',
  SETTINGS_EXPANDER: 'settings-expander',
};

// Структура макета за замовчуванням
const defaultLayout = [
  {
    id: 'column-1',
    widgets: [WIDGETS.TOP_ROW, WIDGETS.SCORE_PANEL, WIDGETS.BOARD_WRAPPER],
  },
  {
    id: 'column-2',
    widgets: [WIDGETS.CONTROLS_PANEL],
  },
  {
    id: 'column-3',
    widgets: [WIDGETS.SETTINGS_EXPANDER],
  },
];

/**
 * Завантажує макет з localStorage або повертає стандартний.
 * @returns {typeof defaultLayout}
 */
function loadLayout() {
  if (!isBrowser) return defaultLayout;
  try {
    const savedLayout = localStorage.getItem('gameLayout');
    if (savedLayout) {
      // TODO: Додати валідацію, щоб переконатися, що збережений макет містить усі необхідні віджети
      return JSON.parse(savedLayout);
    }
  } catch (e) {
    console.error('Failed to load layout from localStorage', e);
  }
  return defaultLayout;
}

const { subscribe, set, update } = writable(loadLayout());

/**
 * Зберігає поточний макет у localStorage.
 * @param {typeof defaultLayout} layout
 */
function saveLayout(layout) {
  if (isBrowser) {
    localStorage.setItem('gameLayout', JSON.stringify(layout));
  }
}

// Підписуємося на зміни, щоб автоматично зберігати макет
subscribe(saveLayout);

export const layoutStore = {
  subscribe,
  set,
  update,
  resetLayout: () => {
    set(defaultLayout);
    saveLayout(defaultLayout);
  },
}; 