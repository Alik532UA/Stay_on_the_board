<script>
  import { navigationService } from '$lib/services/navigationService.js';
  import { _ } from 'svelte-i18n';
  import SvgIcons from '../SvgIcons.svelte';
  import { showGameModeSelector, showGameInfoModal } from '$lib/utils/uiHelpers.js';
  import { hotkeyTooltip } from '$lib/actions/hotkeyTooltip.js';
  import { customTooltip } from '$lib/actions/customTooltip.js';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';

  import { columnStyleMode } from '$lib/stores/columnStyleStore.js';
  import { logService } from '$lib/services/logService.js';

  function handleMainMenuClick() {
    try {
      navigationService.goToMainMenu();
    } catch (error) {
      logService.ui('Error navigating to main menu:', error);
      // Fallback: direct navigation
      window.location.href = '/';
    }
  }

  function handleLocalSetupClick() {
    navigationService.goTo('/local-setup');
  }

  /** @param {KeyboardEvent} e */
  function handleKeydown(e) {
    if (e.code === 'KeyI') {
      e.preventDefault();
      showGameInfoModal();
    } else if (e.code === 'Escape') {
      e.preventDefault();
      handleMainMenuClick();
    }
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeydown);
    return () => {
      window.removeEventListener('keydown', handleKeydown);
    };
  });
</script>

<style>
  .game-board-top-row {
    margin: 0;
  }
</style>

<div class="game-board-top-row">
  <button class="main-menu-btn" use:hotkeyTooltip={{ key: 'ESC' }} on:click={handleMainMenuClick} data-testid="top-row-main-menu-btn">
    <SvgIcons name="home" />
  </button>
  {#if $page.route.id?.includes('/game/local')}
    <button class="main-menu-btn" use:customTooltip={$_('tooltips.localGameSettings')} on:click={handleLocalSetupClick} data-testid="local-game-settings-btn">
      <SvgIcons name="hamburger-menu" />
    </button>
  {/if}
  <button class="main-menu-btn" use:hotkeyTooltip={{ key: 'I' }} on:click={showGameInfoModal} data-testid="game-info-btn">
    <SvgIcons name="info" />
  </button>
  {#if false}
    <button class="main-menu-btn" use:customTooltip={$columnStyleMode === 'editing' ? 'Switch to Fixed' : 'Switch to Editing'} on:click={() => columnStyleMode.update(v => v === 'fixed' ? 'editing' : 'fixed')} style="display: flex; align-items: center; justify-content: center;" data-testid="column-style-mode-btn">
      <SvgIcons name="palette" />
      {#if $columnStyleMode === 'editing'}
        <span style="display: flex; align-items: center; justify-content: center; margin-left: 4px;"><SvgIcons name="editing" /></span>
      {:else}
        <span style="display: flex; align-items: center; justify-content: center; margin-left: 4px;"><SvgIcons name="fixed" /></span>
      {/if}
    </button>
  {/if}

</div>