<script>
  import { navigateToMainMenu } from '$lib/utils/navigation.js';
  import { _ } from 'svelte-i18n';
</script>

<button 
  class="floating-close-btn" 
  aria-label={$_('ui.closeAndReturnToMenu') || 'Закрити і повернутися в меню'}
  title={$_('ui.closeAndReturnToMenu') || 'Закрити і повернутися в меню'}
  onclick={navigateToMainMenu}
>
  &times;
</button>

<style>
  .floating-close-btn {
    position: fixed;
    top: 20px;
    right: 20px;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: none;
    background: rgba(0, 0, 0, 0.2);
    color: white;
    font-size: 28px;
    line-height: 1;
    font-weight: 300;
    cursor: pointer;
    z-index: 1010; /* Вище, ніж більшість елементів */
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s, transform 0.2s;
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
  }

  .floating-close-btn:hover {
    background: rgba(0, 0, 0, 0.4);
    transform: scale(1.1);
  }

  /* Адаптація для світлої теми */
  [data-theme="light"] .floating-close-btn {
    background: rgba(255, 255, 255, 0.4);
    color: #333;
    border: 1px solid rgba(0, 0, 0, 0.1);
  }

  [data-theme="light"] .floating-close-btn:hover {
    background: rgba(255, 255, 255, 0.7);
  }
</style> 