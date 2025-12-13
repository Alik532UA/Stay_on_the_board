<script lang="ts">
  import { icons, type IconName } from "$lib/icons";

  export let name: string = "";

  // Приведення типу для безпеки, якщо ім'я приходить динамічно
  $: iconComponent = icons[name as IconName];
</script>

{#if iconComponent}
  <!-- 
    $$restProps дозволяє передавати class, style та інші атрибути 
    безпосередньо в SVG компонент 
  -->
  <svelte:component this={iconComponent} {...$$restProps} />
{:else}
  <!-- Фолбек для розробки, щоб бачити, якщо іконка не знайдена -->
  {#if import.meta.env.DEV}
    <span style="color: red; font-size: 10px; border: 1px solid red;"
      >Icon '{name}'?</span
    >
  {/if}
{/if}

<style>
  /* 
    Глобальні стилі для специфічних класів SVG, 
    які раніше були в цьому файлі.
    Ми залишаємо їх тут або переносимо в глобальний CSS, 
    але оскільки вони специфічні для іконок, тут їм гарне місце,
    якщо ми використовуємо :global()
  */

  :global(.crown-svg) {
    max-width: 100%;
    max-height: 100%;
    display: block;
  }

  :global(.multicolor-svg) {
    max-width: 100%;
    max-height: 100%;
    display: block;
  }
</style>
