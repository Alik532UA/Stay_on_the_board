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
    console.log('[PlayerColorProvider] Setting shadow color:', shadowColorRgba);
    rootElement.style.setProperty('--current-player-shadow-color', shadowColorRgba);
    // Перевіряємо, чи змінна встановилася
    const actualValue = rootElement.style.getPropertyValue('--current-player-shadow-color');
    console.log('[PlayerColorProvider] Actual CSS variable value:', actualValue);
    
         // Додатково перевіряємо, чи всі елементи оновилися
     setTimeout(() => {
       const elements = document.querySelectorAll('.game-controls-panel, .game-info-widget, .score-panel, .game-content-block, .game-board, .board-bg-wrapper');
       console.log(`[PlayerColorProvider] Found ${elements.length} elements to check`);
       elements.forEach((el, index) => {
         const computedStyle = window.getComputedStyle(el);
         const boxShadow = computedStyle.boxShadow;
         const cssVariable = computedStyle.getPropertyValue('--current-player-shadow-color');
         console.log(`[PlayerColorProvider] Element ${index} (${el.className}): box-shadow = ${boxShadow}, CSS variable = ${cssVariable}`);
       });
       
       // Додатково перевіряємо всі елементи з box-shadow
       const allElements = document.querySelectorAll('*');
       const elementsWithBoxShadow = Array.from(allElements).filter(el => {
         const style = window.getComputedStyle(el);
         return style.boxShadow !== 'none' && style.boxShadow !== '';
       });
       console.log(`[PlayerColorProvider] Total elements with box-shadow: ${elementsWithBoxShadow.length}`);
       elementsWithBoxShadow.forEach((el, index) => {
         const boxShadow = window.getComputedStyle(el).boxShadow;
         if (boxShadow.includes('var(--current-player-shadow-color)')) {
           console.log(`[PlayerColorProvider] Element with dynamic shadow: ${el.className || el.tagName} = ${boxShadow}`);
         }
       });
     }, 500); // Збільшуємо затримку до 500мс
     
     // Додаткова перевірка через 1 секунду
     setTimeout(() => {
       const elements = document.querySelectorAll('.game-controls-panel, .game-info-widget, .score-panel, .game-content-block, .game-board, .board-bg-wrapper');
       console.log(`[PlayerColorProvider] Delayed check: Found ${elements.length} elements`);
       elements.forEach((el, index) => {
         const computedStyle = window.getComputedStyle(el);
         const boxShadow = computedStyle.boxShadow;
         console.log(`[PlayerColorProvider] Delayed Element ${index} (${el.className}): box-shadow = ${boxShadow}`);
       });
     }, 1000);
  } $: if (rootElement && !$currentPlayerColor) {
    // Якщо немає кольору (не локальна гра), використовуємо стандартний колір тіні
    console.log('[PlayerColorProvider] Removing shadow color, using default');
    rootElement.style.removeProperty('--current-player-shadow-color');
    // Перевіряємо, чи змінна видалилася
    const actualValue = rootElement.style.getPropertyValue('--current-player-shadow-color');
    console.log('[PlayerColorProvider] CSS variable after removal:', actualValue);
  }
</script>

<!-- Цей компонент не рендерить нічого, він тільки оновлює CSS змінну --> 