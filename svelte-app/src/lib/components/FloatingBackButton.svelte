<script>
  import { navigateBack } from '$lib/utils/navigation.js';
  import { _ } from 'svelte-i18n';
</script>

<button 
  class="floating-back-btn" 
  aria-label={$_('ui.goBack') || 'Повернутися назад'}
  title={$_('ui.goBack') || 'Повернутися назад'}
  onclick={navigateBack}
>
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"></line>
    <polyline points="12 19 5 12 12 5"></polyline>
  </svg>
</button>

<style>
  .floating-back-btn {
    position: fixed;
    top: 20px;
    left: 20px;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    border: none;
    background: rgba(0, 0, 0, 0.2);
    color: white;
    cursor: pointer;
    z-index: 1010;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s, transform 0.2s;
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
  }
  .floating-back-btn:hover {
    background: rgba(0, 0, 0, 0.4);
    transform: scale(1.1);
  }
  [data-theme="light"] .floating-back-btn {
    background: rgba(255, 255, 255, 0.4);
    color: #333;
    border: 1px solid rgba(0, 0, 0, 0.1);
  }
  [data-theme="light"] .floating-back-btn:hover {
    background: rgba(255, 255, 255, 0.7);
  }
</style> 