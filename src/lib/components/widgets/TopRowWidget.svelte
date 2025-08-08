<script>
  import { navigationService } from '$lib/services/navigationService.js';
  import { _ } from 'svelte-i18n';
  import SvgIcons from '../SvgIcons.svelte';
  import { showGameModeSelector, showGameInfoModal } from '$lib/utils/uiHelpers.js';

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
</script>

<style>
  .game-board-top-row {
    margin: 0;
  }
</style>

<div class="game-board-top-row">
  <button class="main-menu-btn" title={$_('gameBoard.mainMenu')} on:click={handleMainMenuClick}>
    <SvgIcons name="home" />
  </button>
  {#if false}
    <button class="main-menu-btn" title={$_('gameModes.changeModeTooltip')} on:click={showGameModeSelector}>
      <SvgIcons name="game-mode" />
    </button>
  {/if}
  <button class="main-menu-btn" title={$_('gameBoard.info')} on:click={showGameInfoModal}>
    <SvgIcons name="info" />
  </button>
  {#if false}
    <button class="main-menu-btn" title={$columnStyleMode === 'editing' ? 'Switch to Fixed' : 'Switch to Editing'} on:click={() => columnStyleMode.update(v => v === 'fixed' ? 'editing' : 'fixed')} style="display: flex; align-items: center; justify-content: center;">
      <SvgIcons name="palette" />
      {#if $columnStyleMode === 'editing'}
        <span style="display: flex; align-items: center; justify-content: center; margin-left: 4px;"><SvgIcons name="editing" /></span>
      {:else}
        <span style="display: flex; align-items: center; justify-content: center; margin-left: 4px;"><SvgIcons name="fixed" /></span>
      {/if}
    </button>
  {/if}

</div> 