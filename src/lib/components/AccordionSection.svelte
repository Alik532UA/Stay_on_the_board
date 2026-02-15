<script>
  import { slide } from "svelte/transition";

  export let isOpen = false;
</script>

<div class="accordion-section" class:open={isOpen}>
  <button 
    class="accordion-header" 
    on:click={() => (isOpen = !isOpen)}
    aria-expanded={isOpen}
  >
    <div class="header-content">
      <h2 class="accordion-title">
        <slot name="title" />
      </h2>
    </div>
    <span class="accordion-toggle" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="24" height="24">
        <polyline
          points="6 9 12 15 18 9"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </span>
  </button>
  {#if isOpen}
    <div class="accordion-content" transition:slide|local>
      <div class="content-wrapper">
        <slot />
      </div>
    </div>
  {/if}
</div>

<style>
  .accordion-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding: 1rem 1.2rem;
    background: none;
    border: none;
    cursor: pointer;
    text-align: left;
  }

  .accordion-header:hover {
    background: var(--bg-hover, #f9f9f9);
  }

  .header-content {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .accordion-title {
    font-size: 1.2rem;
    font-weight: 600;
    margin: 0;
    color: var(--text-primary);
  }

  .accordion-toggle svg {
    width: 28px;
    height: 28px;
    color: var(--text-accent, #e95420);
    transition: transform 0.3s ease-out;
  }

  .accordion-section.open .accordion-toggle svg {
    transform: rotate(180deg);
  }

  .accordion-content {
    background-color: var(--bg-primary, #fafafa);
  }

  .content-wrapper {
    padding: 0.5rem 1.5rem 1.5rem 1.5rem;
  }
</style>
