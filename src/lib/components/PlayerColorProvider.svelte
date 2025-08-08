<script lang="ts">
  import { currentPlayerColor } from '$lib/stores/derivedState';
  import { onMount } from 'svelte';

  let rootElement: HTMLElement;

  onMount(() => {
    // Знаходимо кореневий елемент (html або body)
    rootElement = document.documentElement;
  });

  // Реактивно оновлюємо CSS змінну при зміні кольору поточного гравця
  $: if (rootElement && $currentPlayerColor) {
    console.log('[PlayerColorProvider] Setting shadow color:', $currentPlayerColor);
    rootElement.style.setProperty('--current-player-shadow-color', $currentPlayerColor);
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