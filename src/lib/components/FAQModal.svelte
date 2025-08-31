<script>
  import { _ } from 'svelte-i18n';
  import { modalStore } from '$lib/stores/modalStore.js';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { onMount, onDestroy } from 'svelte';
  import { logService } from '$lib/services/logService';

  onMount(() => {
    logService.modal('[FAQModal] Component has been mounted.');
  });

  onDestroy(() => {
    logService.modal('[FAQModal] Component is being destroyed.');
  });

  const faqItems = [
    { q: 'faq.q1', a: 'faq.a1' },
    { q: 'faq.q8', a: 'faq.a8' },
    { q: 'faq.q7', a: 'faq.a7' },
    { q: 'faq.q10', a: 'faq.a10' },
    { q: 'faq.q4', a: 'faq.a4' },
    { q: 'faq.q2', a: 'faq.a2' },
    { q: 'faq.q9', a: 'faq.a9' },
    { q: 'faq.q3', a: 'faq.a3' },
    { q: 'faq.q5', a: 'faq.a5' },
    { q: 'faq.q6', a: 'faq.a6' },
  ];
</script>

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
    <p>{$_(item.a)}</p>
  </details>
{/each}

<style>
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