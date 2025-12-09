export const focusManager = {
  /**
   * Фокусує елемент з затримкою (аналог setTimeout для фокусу)
   * @param el - HTML елемент
   * @param delayMs - затримка у мс
   */
  focusWithDelay(el: HTMLElement | null, delayMs = 0) {
    if (!el) return;
    setTimeout(() => {
      if (el && typeof el.focus === 'function') el.focus();
    }, delayMs);
  }
}; 
