import { tooltipStore } from '$lib/stores/tooltipStore.js';
import { gameSettingsStore } from '$lib/stores/gameSettingsStore.js';
import { get } from 'svelte/store';

/**
 * @param {string[] | undefined} keys
 * @param {string=} title
 * @returns {string}
 */
function formatHotkeys(keys, title) {
  const titleHtml = title ? `<div class="tooltip-title">${title}</div>` : '';
  if (!keys || keys.length === 0) return titleHtml;

  const keyElements = keys.map(key => {
    let keyText = key;
    if (key.startsWith('Key')) {
      if (key === 'KeyI') {
        keyText = 'i';
      } else {
        keyText = key.substring(3);
      }
    } else if (key.startsWith('Numpad')) {
      keyText = `NumPad ${key.substring(6)}`;
    } else if (key.startsWith('Digit')) {
      keyText = key.substring(5);
    }
    const className = keyText.length === 1 ? 'hotkey-kbd single-char' : 'hotkey-kbd';
    return `<div class="hotkey-item"><span class="${className}">${keyText}</span></div>`;
  }).join('');
  
  const hotkeyHtml = `<div class="hotkey-title">HotKey</div>${keyElements}`;

  return title ? `${titleHtml}<hr class="tooltip-divider">${hotkeyHtml}` : hotkeyHtml;
}

/**
 * A Svelte action to show a tooltip with assigned hotkeys.
 * Can take a game action name to look up in settings, or a static key.
 * @param {HTMLElement} node The element to attach the tooltip to.
 * @param {import('$lib/stores/gameSettingsStore.js').KeybindingAction | {key: string, title?: string} | string} param
 */
export function hotkeyTooltip(node, param) {
  let tooltipContent = '';
  const originalTitle = node.title;
  node.title = '';

  /** @param {import('$lib/stores/gameSettingsStore.js').KeybindingAction | {key: string, title?: string} | string} newParam */
  function updateTooltipContent(newParam) {
    const settings = get(gameSettingsStore);
    let keys, title;

    if (typeof newParam === 'string') {
      keys = settings.keybindings[/** @type {import('$lib/stores/gameSettingsStore.js').KeybindingAction} */ (newParam)];
      title = undefined;
    } else if (typeof newParam === 'object') {
      if ('key' in newParam) {
        keys = [newParam.key];
      } else if ('action' in newParam) {
        keys = settings.keybindings[newParam.action];
      }
      title = newParam.title;
    }
    
    tooltipContent = formatHotkeys(keys, title);
  }

  updateTooltipContent(param);

  const unsubscribe = gameSettingsStore.subscribe(settings => {
    let keys, title;
    if (typeof param === 'string') {
      keys = settings.keybindings[/** @type {import('$lib/stores/gameSettingsStore.js').KeybindingAction} */ (param)];
      title = undefined;
    } else if (typeof param === 'object') {
      if ('key' in param) {
        keys = [param.key];
      } else if ('action' in param) {
        keys = settings.keybindings[param.action];
      }
      title = param.title;
    }
    tooltipContent = formatHotkeys(keys, title);
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
     * @param {import('$lib/stores/gameSettingsStore.js').KeybindingAction | {key: string, title?: string} | string} newParam
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