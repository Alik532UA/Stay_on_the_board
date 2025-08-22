import { quintOut } from 'svelte/easing';

export function safeScale(node: HTMLElement, params: { duration: number, easing: typeof quintOut }) {
  const style = getComputedStyle(node);
  const transform = style.transform === 'none' ? '' : style.transform;

  return {
    duration: params.duration,
    easing: params.easing,
    css: (t: number) => {
      const eased = params.easing(t);
      return `
        transform: ${transform} scale(${eased});
        opacity: ${t};
      `;
    }
  };
}