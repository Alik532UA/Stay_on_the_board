<script lang="ts">
  import { _ } from "svelte-i18n";
  import { onMount } from "svelte";
  import { logService } from "$lib/services/logService.js";

  // FIX: Import decomposed components
  import TestStartPositionControls from "./test-mode/TestStartPositionControls.svelte";
  import TestComputerMoveControls from "./test-mode/TestComputerMoveControls.svelte";

  onMount(() => {
    logService.testMode("TestModeWidget mounted");
  });
</script>

<div class="test-mode-widget">
  <h3 class="test-mode-widget-title">{$_("testMode.title")}</h3>

  <TestStartPositionControls />

  <hr class="test-mode-divider" />

  <TestComputerMoveControls />
</div>

<style>
  .test-mode-widget {
    background: var(--background-alt, #1e1e1e);
    border-radius: var(--unified-border-radius, 12px);
    padding: 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    width: 150px;
  }
  .test-mode-widget-title {
    font-weight: 700;
    text-align: center;
    color: var(--text-color, #fff);
    margin-bottom: 0.25rem;
  }
  .test-mode-divider {
    border: none;
    border-top: var(--global-border-width) solid var(--border-color);
    margin: 0.125rem 0;
  }
</style>
