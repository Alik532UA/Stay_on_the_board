<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { t } from "$lib/i18n/typedI18n";
  import ToggleButton from "./ToggleButton.svelte";
  import StyledButton from "./ui/StyledButton.svelte";

  export let limitReplayPath: boolean;
  export let currentStep: number;
  export let totalSteps: number;
  export let autoPlayDirection: "paused" | "forward" | "backward";

  const dispatch = createEventDispatcher();
</script>

<div class="replay-ui-container">
  <div class="replay-controls">
    <StyledButton
      shape="circle"
      variant="menu"
      dataTestId="replay-prev-step-btn"
      on:click={() => dispatch("goToStep", currentStep - 1)}
      disabled={currentStep === 0}
      title="Previous Step">«</StyledButton
    >
    <StyledButton
      shape="circle"
      variant={autoPlayDirection === "backward" ? "primary" : "menu"}
      dataTestId="replay-play-backward-btn"
      on:click={() => dispatch("toggleAutoPlay", "backward")}
      title="Pop Play Backward"
    >
      {#if autoPlayDirection === "backward"}❚❚{:else}◀{/if}
    </StyledButton>
    <StyledButton
      shape="circle"
      variant={autoPlayDirection === "forward" ? "primary" : "menu"}
      dataTestId="replay-play-forward-btn"
      on:click={() => dispatch("toggleAutoPlay", "forward")}
      title="Pop Play Forward"
    >
      {#if autoPlayDirection === "forward"}❚❚{:else}▶{/if}
    </StyledButton>
    <StyledButton
      shape="circle"
      variant="menu"
      dataTestId="replay-next-step-btn"
      on:click={() => dispatch("goToStep", currentStep + 1)}
      disabled={currentStep >= totalSteps - 1}
      title="Next Step">»</StyledButton
    >
    <div class="step-counter" data-testid="replay-step-counter">
      {$t("replay.step", { current: currentStep + 1, total: totalSteps })}
    </div>
  </div>

  <div class="limit-path-container">
    <ToggleButton
      label={$t("replay.limitPath")}
      checked={limitReplayPath}
      on:toggle={() => dispatch("toggleLimitPath")}
      dataTestId="limit-path-toggle"
    />
  </div>
</div>

<style>
  .replay-ui-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    margin-top: 16px;
    width: 100%;
  }

  .limit-path-container {
    width: 100%;
    max-width: 250px; /* Or adjust as needed */
    --button-height: 40px; /* Example height */
  }

  .replay-controls {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    background: var(--bg-secondary);
    padding: 12px;
    border-radius: 16px;
    box-shadow: var(--unified-shadow);
    width: 100%;
  }
  .step-counter {
    font-weight: bold;
    min-width: 80px;
    text-align: center;
  }
</style>
