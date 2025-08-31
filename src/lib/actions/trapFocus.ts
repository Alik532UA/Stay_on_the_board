/**
 * Svelte Action to trap focus within a node.
 * @param {HTMLElement} node The node to trap focus within.
 */
export function trapFocus(node: HTMLElement) {
  const previousActiveElement = document.activeElement as HTMLElement;

  const focusableElementsString = [
    'a[href]',
    'area[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'button:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  const focusableElements = Array.from(node.querySelectorAll<HTMLElement>(focusableElementsString));
  const firstFocusableElement = focusableElements[0];
  const lastFocusableElement = focusableElements[focusableElements.length - 1];

  firstFocusableElement?.focus();

  function handleKeydown(event: KeyboardEvent) {
    if (event.key !== 'Tab') return;

    if (event.shiftKey) {
      if (document.activeElement === firstFocusableElement) {
        event.preventDefault();
        lastFocusableElement?.focus();
      }
    } else {
      if (document.activeElement === lastFocusableElement) {
        event.preventDefault();
        firstFocusableElement?.focus();
      }
    }
  }

  document.addEventListener('keydown', handleKeydown);

  return {
    destroy() {
      document.removeEventListener('keydown', handleKeydown);
      previousActiveElement?.focus();
    },
  };
}