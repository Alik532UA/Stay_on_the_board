import { tooltipStore } from '$lib/stores/tooltipStore.js';

/**
 * A Svelte action to show a custom tooltip using the element's title attribute.
 * @param {HTMLElement} node The element to attach the tooltip to.
 * @param {string} [customContent] Optional custom content to override the title.
 */
export function customTooltip(node, customContent) {
  let tooltipContent = customContent || node.title;
  const originalTitle = node.title;
  node.title = '';

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
     * @param {string} newContent
     */
    update(newContent) {
      tooltipContent = newContent || originalTitle;
    },
    destroy() {
      node.removeEventListener('mouseover', mouseOver);
      node.removeEventListener('mousemove', mouseMove);
      node.removeEventListener('mouseleave', mouseLeave);
      node.title = originalTitle;
    }
  };
}