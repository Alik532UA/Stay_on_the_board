<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import SvgIcons from '$lib/components/SvgIcons.svelte';
  import { logService } from '$lib/services/logService.js';
  
  const dispatch = createEventDispatcher();
  
  export let value = '#e63946';
  export let isOpen = false;
  
  // Змінна для поточного значення кольору
  let currentValue = value;
  
  // 8 готових кольорів + центральна кнопка для палітри
  const predefinedColors = [
    '#e63946', // червоний
    '#457b9d', // синій
    '#2a9d8f', // зелений
    '#f4a261', // помаранчевий
    '#e76f51', // кораловий
    '#9b5de5', // фіолетовий
    '#f15bb5', // рожевий
    '#00bbf9'  // голубий
  ];
  
  // Реактивний блок для оновлення при зміні value
  $: {
    console.log('ColorPicker: value prop changed to', value);
    currentValue = value;
    console.log('ColorPicker: currentValue updated to', currentValue);
  }
  
  function selectColor(color: string) {
    logService.action(`Click: "Вибір кольору: ${color}" (ColorPicker)`);
    console.log('ColorPicker: selectColor called with', color);
    console.log('ColorPicker: current value before update', value);
    
    // Оновлюємо значення та диспатчимо подію
    value = color;
    console.log('ColorPicker: value after assignment', value);
    
    dispatch('change', { value: color });
    console.log('ColorPicker: change event dispatched with', color);
    
    // Закриваємо дропдаун після вибору
    isOpen = false;
  }
  
  function openColorPicker() {
    logService.action('Click: "Відкрити палітру кольорів" (ColorPicker)');
    isOpen = false;
    // Відкриваємо нативний color picker
    const input = document.createElement('input');
    input.type = 'color';
    input.value = value;
    input.addEventListener('change', (e) => {
      selectColor((e.target as HTMLInputElement).value);
    });
    input.click();
  }
  
  function toggleDropdown() {
    logService.action('Click: "Перемикач кольорів" (ColorPicker)');
    isOpen = !isOpen;
  }
  
  // Закриваємо дропдаун при кліку поза ним
  function handleClickOutside(event: MouseEvent) {
    if (!(event.target as Element).closest('.color-picker')) {
      isOpen = false;
    }
  }
</script>

<svelte:window on:click={handleClickOutside} />

<div class="color-picker">
  <button 
    class="color-preview"
    style="background-color: {currentValue}"
    on:click={toggleDropdown}
    title="Обрати колір"
    aria-label="Обрати колір гравця"
  ></button>
  
  {#if isOpen}
    <div class="color-dropdown">
      <div class="color-grid">
        {#each predefinedColors.slice(0, 4) as color}
          <button 
            class="color-option"
            style="background-color: {color}"
            on:click={() => selectColor(color)}
            title="Обрати {color}"
            aria-label="Обрати колір {color}"
          ></button>
        {/each}
        <button 
          class="color-option palette-button"
          on:click={openColorPicker}
          title="Відкрити палітру кольорів"
        >
          <SvgIcons name="theme" />
        </button>
        {#each predefinedColors.slice(4) as color}
          <button 
            class="color-option"
            style="background-color: {color}"
            on:click={() => selectColor(color)}
            title="Обрати {color}"
            aria-label="Обрати колір {color}"
          ></button>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .color-picker {
    position: relative;
    display: inline-block;
  }
  
  .color-preview {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 2px solid var(--border-color);
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
    /* Видаляємо background, щоб не перекривати inline стилі */
  }
  
  .color-preview:hover {
    transform: scale(1.05);
    box-shadow: 0 2px 8px var(--shadow-color);
  }
  
  .color-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    margin-top: 8px;
    background: var(--bg-secondary);
    border: var(--unified-border);
    border-radius: var(--unified-border-radius);
    box-shadow: var(--unified-shadow);
    z-index: 1000;
    padding: 12px;
    min-width: 120px;
  }
  
  .color-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }
  
  .color-option {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    border: 2px solid var(--border-color);
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .color-option:hover {
    transform: scale(1.1);
    box-shadow: 0 2px 8px var(--shadow-color);
  }
  
  .palette-button {
    color: var(--text-secondary);
    background: transparent !important;
    padding: 0 !important;
    border: none !important;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .palette-button:hover {
    color: var(--text-primary);
    background: transparent !important;
  }
</style> 