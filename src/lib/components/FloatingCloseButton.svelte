<script>
  import { navigateBack } from '$lib/utils/navigation.js';
  import { _ } from 'svelte-i18n';
</script>

<button 
  class="floating-close-btn" 
  aria-label={$_('ui.closeAndReturnToMenu') || 'Закрити і повернутися в меню'}
  title={$_('ui.closeAndReturnToMenu') || 'Закрити і повернутися в меню'}
  onclick={navigateBack}
>
  &times;
</button>

<style>
  .floating-close-btn {
    position: fixed;
    top: 20px;
    right: 20px;
    width: 52px;
    height: 52px;
    border-radius: 50%;
    border: none;
    background: rgba(0, 0, 0, 0.2);
    color: white;
    font-size: 32px;
    line-height: 1;
    font-weight: 300;
    cursor: pointer;
    z-index: 1010; /* Вище, ніж більшість елементів */
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s, transform 0.2s, box-shadow 0.2s;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .floating-close-btn:hover {
    background: rgba(0, 0, 0, 0.4);
    transform: scale(1.05);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  }
</style> 