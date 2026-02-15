<script lang="ts">
  import { t } from "$lib/i18n/typedI18n";
  import type { TranslationKey } from "$lib/types/i18n";
  import { modalStore } from "$lib/stores/modalStore";
  import { onMount, onDestroy } from "svelte";
  import { logService } from "$lib/services/logService";
  import StyledButton from "$lib/components/ui/StyledButton.svelte";

  // Props для навігації, які передаються з GameModeModal
  export let onOk = () => modalStore.closeModal();
  export let onRules: (() => void) | null = null;

  onMount(() => {
    logService.modal("[FAQModal] Component has been mounted.");
  });

  onDestroy(() => {
    logService.modal("[FAQModal] Component is being destroyed.");
  });

  const faqItems: Array<{ q: TranslationKey; a: TranslationKey }> = [
    { q: "faq.q1", a: "faq.a1" },
    { q: "faq.q8", a: "faq.a8" },
    { q: "faq.q7", a: "faq.a7" },
    { q: "faq.q10", a: "faq.a10" },
    { q: "faq.q4", a: "faq.a4" },
    { q: "faq.q2", a: "faq.a2" },
    { q: "faq.q9", a: "faq.a9" },
    { q: "faq.q3", a: "faq.a3" },
    { q: "faq.q5", a: "faq.a5" },
    { q: "faq.q6", a: "faq.a6" },
  ];
</script>

<!-- FIX: Додано data-testid та структуру меню -->
<div class="faq-content" data-testid="faq-content">
  <h2
    class="modal-title-menu"
    data-testid="faq-modal-title"
    data-i18n-key="faq.title"
  >
    {$t("faq.title")}
  </h2>

  <!-- FIX: Додано data-testid="faq-list" -->
  <div class="faq-list" data-testid="faq-list">
    {#each faqItems as item, i}
      <details class="faq-item" open={i === 0}>
        <summary>
          {$t(item.q)}
          <span class="faq-arrow" aria-hidden="true">
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
        </summary>
        <p>{$t(item.a)}</p>
      </details>
    {/each}
  </div>

  <div class="actions-column">
    <StyledButton
      variant="primary"
      size="large"
      on:click={onOk}
      dataTestId="faq-modal-ok-btn"
    >
      {$t("modal.ok")}
    </StyledButton>

    {#if onRules}
      <StyledButton
        variant="info"
        on:click={onRules}
        dataTestId="faq-modal-rules-btn"
      >
        {$t("rulesPage.title")}
      </StyledButton>
    {/if}
  </div>
</div>

<style>
  .faq-content {
    display: flex;
    flex-direction: column;
    gap: 20px;
    width: 100%;
    /* FIX: Обмежуємо висоту та ховаємо зовнішній скрол */
    height: 100%;
    max-height: 80vh; /* Залишаємо місце для відступів модалки */
    overflow: hidden;
  }

  .modal-title-menu {
    text-align: center;
    font-size: 1.8em;
    font-weight: 800;
    color: #fff;
    margin: 0;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    flex-shrink: 0; /* Заголовок не стискається */
  }

  .faq-list {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 16px;
    padding: 0 16px;
    border: 1px solid rgba(255, 255, 255, 0.1);

    /* FIX: Вмикаємо внутрішній скрол */
    overflow-y: auto;
    flex: 1; /* Займає весь доступний простір */
    min-height: 0; /* Важливо для роботи скролу у Flexbox */

    /* Стилізація скролбару */
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
  }

  .faq-list::-webkit-scrollbar {
    width: 6px;
  }
  .faq-list::-webkit-scrollbar-track {
    background: transparent;
  }
  .faq-list::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.3);
    border-radius: 3px;
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
    padding-right: 32px;
    color: #fff;
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
    color: rgba(255, 255, 255, 0.8);
    white-space: pre-line;
  }

  .actions-column {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 10px;
    flex-shrink: 0; /* Кнопки не стискаються */
  }
</style>
