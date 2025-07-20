<script>
  import { _ } from 'svelte-i18n';
  import { modalStore } from '$lib/stores/modalStore.js';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';

  const faqItems = Array.from({ length: 10 }, (_, i) => ({
    q: `faq.q${i + 1}`,
    a: `faq.a${i + 1}`,
  }));
</script>

<div class="faq-container">
  {#each faqItems as item, i}
    <details class="faq-item">
      <summary>{$_(item.q)}</summary>
      <p>{@html $_(item.a)}</p>
    </details>
  {/each}
</div>

<style>
  .faq-container {
    text-align: left;
    max-height: 60vh;
    overflow-y: auto;
    padding-right: 10px;
  }

  /* --- СТИЛІ ДЛЯ СКРОЛБАРУ --- */
  .faq-container::-webkit-scrollbar {
    width: 8px;
  }

  .faq-container::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
  }

  .faq-container::-webkit-scrollbar-thumb {
    background-color: var(--text-accent, #ff9800);
    border-radius: 4px;
    border: 2px solid transparent;
    background-clip: content-box;
  }

  .faq-container::-webkit-scrollbar-thumb:hover {
    background-color: #fff;
  }
  .faq-item {
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding: 16px 0;
  }
  .faq-item:last-child {
    border-bottom: none;
  }
  .faq-item summary {
    font-weight: 600;
    cursor: pointer;
    list-style: none;
    position: relative;
    padding-right: 24px;
  }
  .faq-item summary::-webkit-details-marker {
    display: none;
  }
  .faq-item summary::after {
    content: '+';
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    font-size: 1.4em;
    color: var(--text-accent, #ff9800);
    transition: transform 0.2s;
  }
  .faq-item[open] summary::after {
    transform: translateY(-50%) rotate(45deg);
  }
  .faq-item p {
    margin-top: 12px;
    line-height: 1.6;
    color: var(--text-secondary, #ccc);
    white-space: pre-line;
  }
  .faq-item p :global(a) {
    color: var(--text-accent, #ff9800);
  }
</style> 