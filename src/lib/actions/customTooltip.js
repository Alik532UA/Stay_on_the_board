import { tooltipStore } from '$lib/stores/tooltipStore.js';
import { logService } from '$lib/services/logService.js';

/**
 * A Svelte action to show a custom tooltip.
 * @param {HTMLElement} node The element to attach the tooltip to.
 * @param {string} [customContent] Optional custom content to override the title.
 */
export function customTooltip(node, customContent) {
  let tooltipContent = customContent || node.title;
  const originalTitle = node.title;
  node.title = '';

  logService.tooltip('customTooltip action created for node:', node);

  /** @param {MouseEvent} event */
  const mouseOver = (event) => {
    if (tooltipContent) {
      logService.tooltip('mouseOver: scheduling tooltip show for owner', node);
      tooltipStore.scheduleShow(tooltipContent, event.pageX + 10, event.pageY + 10, 700, node);
    }
  };

  const mouseMove = (/** @type {MouseEvent} */ event) => {
    tooltipStore.move(event.pageX + 10, event.pageY + 10);
  };

  const mouseLeave = () => {
    logService.tooltip('mouseLeave: hiding tooltip');
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
      logService.tooltip('customTooltip updated with new content:', newContent);
      tooltipContent = newContent || originalTitle;
    },
    destroy() {
      logService.tooltip('customTooltip destroyed for node:', node);
      node.removeEventListener('mouseover', mouseOver);
      node.removeEventListener('mousemove', mouseMove);
      node.removeEventListener('mouseleave', mouseLeave);
      node.title = originalTitle;

      // Cancel any scheduled tooltips for this specific node
      tooltipStore.cancelForOwner(node);
      
      // Also attempt to hide any active tooltip if it belongs to this node
      tooltipStore.hideIfOwner(node);
    }
  };
}
