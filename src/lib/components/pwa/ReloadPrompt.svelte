<script lang="ts">
  import { useRegisterSW } from 'virtual:pwa-register/svelte';
  import { onMount, createEventDispatcher } from 'svelte';
  import { logService } from '$lib/services/logService';
  import { t } from "$lib/i18n/typedI18n";
  import StyledButton from "$lib/components/ui/StyledButton.svelte";

  // Інтервал перевірки оновлень (наприклад, кожні 15 хвилин)
  const CHECK_INTERVAL = 15 * 60 * 1000;

  const { needRefresh, updateServiceWorker, offlineReady } = useRegisterSW({
    onRegistered(r) {
      logService.info('[PWA] Service Worker registered');
      r && setInterval(() => {
        logService.info('[PWA] Checking for updates and validating version...');
        r.update(); 
      }, CHECK_INTERVAL);
    },
    onRegisterError(error) {
      logService.error('[PWA] Service Worker registration failed', error);
    },
  });

  const close = () => {
    offlineReady.set(false);
    needRefresh.set(false);
  };

  const update = async () => {
    logService.action('[PWA] User confirmed update. Updating SW...');
    await updateServiceWorker(true); // true = force reload
  };
</script>

{#if $needRefresh}
  <div class="pwa-toast" role="alert" aria-labelledby="toast-message">
    <div class="text-container">
      <p class="title">{$t("updateNotification.title")}</p>
      <p class="description">{$t("updateNotification.description")}</p>
    </div>
    <div class="pwa-buttons">
      <StyledButton variant="primary" on:click={update} style="width: 100%; margin-bottom: 8px;">
        {$t("updateNotification.updateButton")}
      </StyledButton>
      <button on:click={close} class="dismiss-btn">
        Пізніше
      </button>
    </div>
  </div>
{/if}

<style>
  .pwa-toast {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background-color: var(--bg-secondary);
    color: var(--text-primary);
    padding: 20px 24px;
    border-radius: 16px;
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.5);
    z-index: 10002; /* Трохи вище інших */
    border: var(--global-border-width) solid var(--control-selected);
    animation: slide-in 0.5s ease-out;
    width: 90vw;
    max-width: 380px;
    box-sizing: border-box;
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  @keyframes slide-in {
    from {
      transform: translate(-50%, 120px);
      opacity: 0;
    }
    to {
      transform: translate(-50%, 0);
      opacity: 1;
    }
  }

  .text-container {
    margin-bottom: 0;
  }

  .title {
    margin: 0 0 8px 0;
    font-weight: 700;
    font-size: 1.2em;
  }

  .description {
    margin: 0;
    font-size: 0.95em;
    opacity: 0.9;
    line-height: 1.5;
  }

  .pwa-buttons {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .dismiss-btn {
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 8px;
    font-size: 0.9em;
    text-decoration: underline;
  }
  .dismiss-btn:hover {
    color: var(--text-primary);
  }
</style>
