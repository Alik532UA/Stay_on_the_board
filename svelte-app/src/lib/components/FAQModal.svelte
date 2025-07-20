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
      <summary>
        {$_(item.q)}
        <span class="faq-arrow" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="24" height="24">
            <polyline points="6 9 12 15 18 9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
      </summary>
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
    padding-right: 32px; /* Додаємо відступ для стрілки */
  }
  .faq-item summary::-webkit-details-marker {
    display: none;
  }
  .faq-arrow {
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    display: inline-flex;
    align-items: center;
  }

  .faq-arrow svg {
    width: 24px;
    height: 24px;
    color: var(--text-accent, #ff9800);
    transition: transform 0.3s ease-out;
  }

  .faq-item[open] .faq-arrow svg {
    transform: rotate(180deg);
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