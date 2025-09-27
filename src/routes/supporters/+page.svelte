<script>
  import FloatingBackButton from '$lib/components/FloatingBackButton.svelte';
  import { _ } from 'svelte-i18n';
</script>

<div class="supporters-container">
  <div class="header-container">
    <FloatingBackButton />
    <h1>{$_('supportersPage.title')}</h1>
  </div>
  <p class="gratitude-text">{$_('supportersPage.gratitudeText')}</p>
  
  <div class="supporters-list">
    <div class="supporter-item" role="button" tabindex="0" onclick={() => window.open('https://steamcommunity.com/profiles/76561198948943743/', '_blank', 'noopener,noreferrer')} onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && window.open('https://steamcommunity.com/profiles/76561198948943743/', '_blank', 'noopener,noreferrer')}>den</div>
    <div class="supporter-item">brusnikaa</div>
    <div class="supporter-item" role="button" tabindex="0" onclick={() => window.open('https://steamcommunity.com/profiles/76561198055854871/', '_blank', 'noopener,noreferrer')} onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && window.open('https://steamcommunity.com/profiles/76561198055854871/', '_blank', 'noopener,noreferrer')}>Khaaaa</div>
    <div class="supporter-item">Destroyter94</div>
    <div class="supporter-item">MrGrom</div>
    <!-- Майбутні імена будуть додаватися сюди -->
  </div>
  <p class="call-to-action-text">{@html $_('supportersPage.callToAction')}</p>
  <button class="support-btn" onclick={() => window.open('https://send.monobank.ua/jar/8TPmFKQTCK', '_blank', 'noopener,noreferrer')}>
    {$_('supportersPage.supportButton')}
  </button>
</div>

<style>
  .supporters-container {
    text-align: center;
    max-width: 800px;
    margin: 2rem auto;
    color: var(--text-primary);
  }
  
  .header-container {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 2rem;
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
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .supporter-item:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(255, 152, 0, 0.2);
  }
  .call-to-action-text {
    margin-top: 3rem;
    font-size: 1.1em;
    line-height: 1.7;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
    color: var(--text-secondary);
  }
  .call-to-action-text :global(a) {
    color: var(--text-accent, #ff9800);
    text-decoration: none; /* Прибираємо підкреслення */
    font-weight: 600;
    transition: color 0.2s;
  }
  .call-to-action-text :global(a:hover) {
    color: #fff;
  }

  .support-btn {
    margin-top: 2rem;
    background: linear-gradient(90deg, #ff9800 60%, #ffb300 100%);
    color: #fff;
    border: none;
    border-radius: 12px;
    padding: 14px 36px;
    font-weight: bold;
    cursor: pointer;
    font-size: 1.2em;
    transition: all 0.2s ease;
    box-shadow: 0 4px 20px rgba(255, 152, 0, 0.3);
  }

  .support-btn:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 24px rgba(255, 152, 0, 0.4);
  }
</style> 