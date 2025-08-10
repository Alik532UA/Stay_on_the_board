/**
 * An action that removes focus from the element when it is clicked.
 * This is useful for buttons that trigger an action but should not
 * retain focus afterward.
 * @param {HTMLElement} node The element to apply the action to.
 */
export function blurOnClick(node: HTMLElement) {
  const handleClick = () => {
    node.blur();
  };

  node.addEventListener('click', handleClick);

  return {
    destroy() {
      node.removeEventListener('click', handleClick);
    }
  };
}