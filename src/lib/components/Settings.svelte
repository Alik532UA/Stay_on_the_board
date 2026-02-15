<script lang="ts">
  import { onMount } from "svelte";
  import { t } from "$lib/i18n/typedI18n";
  import { page } from "$app/stores";

  // Імпорт вкладок
  import GeneralTab from "./settings/tabs/GeneralTab.svelte";
  import VoiceTab from "./settings/tabs/VoiceTab.svelte";
  import HotkeysTab from "./settings/HotkeysTab.svelte";

  // Tabs configuration
  type Tab = "general" | "voice" | "hotkeys";
  let activeTab: Tab = "general";

  onMount(() => {
    // Check URL params for tab selection
    const tabParam = $page.url.searchParams.get("tab");
    if (tabParam && ["general", "voice", "hotkeys"].includes(tabParam)) {
      activeTab = tabParam as Tab;
    }
  });

  function setTab(tab: Tab) {
    activeTab = tab;
    // Update URL without reload
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    window.history.replaceState({}, "", url);
  }
</script>

<div class="settings-container">
  <!-- Tabs Header -->
  <div class="tabs-header">
    <button
      class="tab-btn"
      class:active={activeTab === "general"}
      on:click={() => setTab("general")}
      data-testid="settings-tab-general"
    >
      {$t("settings.tabs.general")}
    </button>
    <button
      class="tab-btn"
      class:active={activeTab === "voice"}
      on:click={() => setTab("voice")}
      data-testid="settings-tab-voice"
    >
      {$t("settings.tabs.voice")}
    </button>
    <button
      class="tab-btn"
      class:active={activeTab === "hotkeys"}
      on:click={() => setTab("hotkeys")}
      data-testid="settings-tab-hotkeys"
    >
      {$t("settings.tabs.hotkeys")}
    </button>
  </div>

  <!-- Tab Content -->
  <div class="tab-content">
    {#if activeTab === "general"}
      <GeneralTab />
    {:else if activeTab === "voice"}
      <VoiceTab />
    {:else if activeTab === "hotkeys"}
      <HotkeysTab />
    {/if}
  </div>
</div>

<style>
  .settings-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
  }

  /* Tabs Header */
  .tabs-header {
    display: flex;
    justify-content: center;
    gap: 10px;
    margin-bottom: 10px;
    flex-wrap: wrap;
  }

  .tab-btn {
    background: var(--bg-secondary);
    color: var(--text-secondary);
    border: var(--global-border-width) solid var(--border-color);
    padding: 10px 24px;
    border-radius: 24px;
    font-weight: bold;
    font-size: 1.1em;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .tab-btn:hover {
    background: var(--control-bg);
    color: var(--text-primary);
  }

  .tab-btn.active {
    background: var(--control-selected);
    color: var(--control-selected-text);
    border-color: var(--control-selected);
    box-shadow: 0 4px 12px var(--shadow-color);
  }
</style>
