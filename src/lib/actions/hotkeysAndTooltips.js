import { tooltipStore } from '$lib/stores/tooltipStore.js';

/**
 * A Svelte action to dynamically assign numeric hotkeys (1-9) and custom tooltips to buttons within a container.
 * @param {HTMLElement} node The container element.
 */
export function hotkeysAndTooltips(node) {
  const buttons = Array.from(node.querySelectorAll('button'));

  buttons.forEach((btn, index) => {
    btn.title = ''; // Remove native title to prevent interference

    const tooltipContent = `HotKey <span class="hotkey-kbd">${index + 1}</span>`;
    /** @type {ReturnType<typeof setTimeout>} */
    let showTimeout;

    const mouseOver = (/** @type {MouseEvent} */ event) => {
      showTimeout = setTimeout(() => {
        tooltipStore.show(tooltipContent, event.pageX + 10, event.pageY + 10);
      }, 1000);
    };

    const mouseMove = (/** @type {MouseEvent} */ event) => {
      tooltipStore.move(event.pageX + 10, event.pageY + 10);
    };

    const mouseLeave = () => {
      clearTimeout(showTimeout);
      tooltipStore.hide();
    };

    btn.addEventListener('mouseover', mouseOver);
    btn.addEventListener('mousemove', mouseMove);
    btn.addEventListener('mouseleave', mouseLeave);
  });

  /** @param {KeyboardEvent} event */
  const handleKeydown = (event) => {
    // Only process hotkeys if the container is visible on screen
    if (node.offsetParent === null) {
      return;
    }

    const keyNumber = parseInt(event.key, 10);
    if (!isNaN(keyNumber) && keyNumber >= 1 && keyNumber <= 9) {
      const buttonIndex = keyNumber - 1;
      if (buttons[buttonIndex]) {
        event.preventDefault();
        buttons[buttonIndex].click();
      }
    }
  };

  window.addEventListener('keydown', handleKeydown);

  return {
    destroy() {
      window.removeEventListener('keydown', handleKeydown);
      // Button-specific listeners are not removed here, as they will be garbage collected
      // when the node (and its buttons) are destroyed.
    }
  };
}