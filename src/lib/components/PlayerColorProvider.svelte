<script lang="ts">
  import { currentPlayerColor } from '$lib/stores/derivedState';
  import { onMount } from 'svelte';

  let rootElement: HTMLElement;

  onMount(() => {
    // Знаходимо кореневий елемент (html або body)
    rootElement = document.documentElement;
  });

  // Реактивно оновлюємо CSS змінну при зміні кольору поточного гравця
  /**
   * Converts a hex color to an rgba color with a given opacity.
   * @param {string} hex - The hex color string (e.g., "#RRGGBB").
   * @param {number} alpha - The alpha transparency (0 to 1).
   * @returns {string} The rgba color string.
   */
  function hexToRgba(hex: string, alpha: number): string {
    if (!hex || !/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
      return 'rgba(0,0,0,0)'; // Return transparent if hex is invalid
    }
    let c = hex.substring(1).split('');
    if (c.length === 3) {
      c = [c[0], c[0], c[1], c[1], c[2], c[2]];
    }
    const num = parseInt(c.join(''), 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  $: if (rootElement && $currentPlayerColor) {
    const shadowColorRgba = hexToRgba($currentPlayerColor, 0.5);
    rootElement.style.setProperty('--current-player-shadow-color', hexToRgba($currentPlayerColor, 0.5));
  } $: if (rootElement && !$currentPlayerColor) {
    // Якщо немає кольору (не локальна гра), використовуємо стандартний колір тіні
    rootElement.style.removeProperty('--current-player-shadow-color');
  }
</script>

<!-- Цей компонент не рендерить нічого, він тільки оновлює CSS змінну --> 
