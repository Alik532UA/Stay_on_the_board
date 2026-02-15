<script lang="ts">
  import { gameSettingsStore } from "$lib/stores/gameSettingsStore";
  import { t } from "$lib/i18n/typedI18n";

  // FIX: Import decomposed components
  import LocalBoardControls from "./LocalBoardControls.svelte";
  import LocalToggleControls from "./LocalToggleControls.svelte";

  $: settings = $gameSettingsStore;
</script>

{#if settings}
  <div class="settings-card">
    <h2 data-testid="local-game-settings-title">
      {$t("localGame.settingsTitle")}
    </h2>

    <div class="settings-list">
      <LocalBoardControls />
      <LocalToggleControls />
    </div>
  </div>
{/if}

<style>
  .settings-card {
    background: var(--bg-secondary);
    padding: 24px;
    border-radius: var(--unified-border-radius);
    box-shadow: var(--unified-shadow);
    border: var(--unified-border);
  }
  h2 {
    text-align: center;
    margin: 0 0 20px 0;
    color: var(--text-primary);
  }
  .settings-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
</style>
