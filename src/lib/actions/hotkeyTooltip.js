import { tooltipStore } from '$lib/stores/tooltipStore.js';
import { settingsStore } from '$lib/stores/settingsStore.ts';
import { get } from 'svelte/store';

/**
 * @param {string[]} keys
 * @returns {string}
 */
function formatHotkeys(keys) {
  if (!keys || keys.length === 0) return '';
  const keyElements = keys.map(key => {
    let keyText = key;
    if (key.startsWith('Key')) {
      keyText = key.substring(3);
    } else if (key.startsWith('Numpad')) {
      keyText = `NumPad ${key.substring(6)}`;
    } else if (key.startsWith('Digit')) {
      keyText = key.substring(5);
    }
    const className = keyText.length === 1 ? 'hotkey-kbd single-char' : 'hotkey-kbd';
    return `<div class="hotkey-item"><span class="${className}">${keyText}</span></div>`;
  }).join('');
  return `<div class="hotkey-title">HotKey</div>${keyElements}`;
}

/**
 * A Svelte action to show a tooltip with assigned hotkeys.
 * Can take a game action name to look up in settings, or a static key.
 * @param {HTMLElement} node The element to attach the tooltip to.
 * @param {import('$lib/stores/settingsStore.ts').KeybindingAction | {key: string}} param
 */
export function hotkeyTooltip(node, param) {
  let tooltipContent = '';
  const originalTitle = node.title;
  node.title = '';

  /** @param {import('$lib/stores/settingsStore.ts').KeybindingAction | {key: string}} newParam */
  function updateTooltipContent(newParam) {
    if (typeof newParam === 'string') {
      const settings = get(settingsStore);
      const keys = settings.keybindings[/** @type {import('$lib/stores/settingsStore.ts').KeybindingAction} */ (newParam)];
      tooltipContent = formatHotkeys(keys);
    } else if (typeof newParam === 'object' && newParam.key) {
      tooltipContent = formatHotkeys([newParam.key]);
    } else {
      tooltipContent = '';
    }
  }

  updateTooltipContent(param);

  const unsubscribe = settingsStore.subscribe(settings => {
    if (typeof param === 'string') {
      const keys = settings.keybindings[/** @type {import('$lib/stores/settingsStore.ts').KeybindingAction} */ (param)];
      tooltipContent = formatHotkeys(keys);
    }
  });

  /** @param {MouseEvent} event */
  const mouseOver = (event) => {
    if (tooltipContent) {
      tooltipStore.scheduleShow(tooltipContent, event.pageX + 10, event.pageY + 10, 700);
    }
  };

  /** @param {MouseEvent} event */
  const mouseMove = (event) => {
    tooltipStore.move(event.pageX + 10, event.pageY + 10);
  };

  const mouseLeave = () => {
    tooltipStore.hide();
  };

  node.addEventListener('mouseover', mouseOver);
  node.addEventListener('mousemove', mouseMove);
  node.addEventListener('mouseleave', mouseLeave);

  return {
    /**
     * @param {import('$lib/stores/settingsStore.ts').KeybindingAction | {key: string}} newParam
     */
    update(newParam) {
      param = newParam;
      updateTooltipContent(newParam);
    },
    destroy() {
      node.removeEventListener('mouseover', mouseOver);
      node.removeEventListener('mousemove', mouseMove);
      node.removeEventListener('mouseleave', mouseLeave);
      unsubscribe();
      node.title = originalTitle;
    }
  };
}