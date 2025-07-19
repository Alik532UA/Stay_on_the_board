<script>
  import FloatingCloseButton from '$lib/components/FloatingCloseButton.svelte';
  import { _ } from 'svelte-i18n';
</script>

<FloatingCloseButton />

<div class="supporters-container">
  <h1>{$_('supportersPage.title')}</h1>
  <p class="gratitude-text">{$_('supportersPage.gratitudeText')}</p>
  
  <div class="supporters-list">
    <div class="supporter-item">Khaaaa</div>
    <!-- Майбутні імена будуть додаватися сюди -->
  </div>
</div>

<style>
  .supporters-container {
    text-align: center;
    max-width: 800px;
    margin: 2rem auto;
    color: var(--text-primary);
  }
  .gratitude-text {
    font-size: 1.2em;
    line-height: 1.6;
    margin-bottom: 2.5rem;
    color: var(--text-secondary);
  }
  .supporters-list {
    margin-top: 2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }
  .supporter-item {
    font-size: 1.3em;
    font-weight: 600;
    color: var(--text-accent, #ff9800);
    background: rgba(255, 255, 255, 0.05);
    padding: 0.5em 1.5em;
    border-radius: 8px;
    border: 1px solid var(--border-color, rgba(255, 152, 0, 0.3));
  }
</style> 