<script lang="ts">
  import { modalStore } from "$lib/stores/modalStore";
  import BoardHiddenExplanationModal from "../modals/BoardHiddenExplanationModal.svelte";
  import { uiStateStore } from "$lib/stores/uiStateStore";
  import { t } from "$lib/i18n/typedI18n";
  import StyledButton from "$lib/components/ui/StyledButton.svelte";

  function showExplanation() {
    modalStore.showModal({
      component: BoardHiddenExplanationModal,
      variant: "menu",
      dataTestId: "board-hidden-explanation-modal",
      buttons: [],
      closeOnOverlayClick: true,
    });
  }

  function dismissWidget() {
    uiStateStore.update((s) => ({ ...s, showBoardHiddenInfo: false }));
  }
</script>

<div class="hidden-board-info">
  <StyledButton
    variant="menu"
    size="small"
    on:click={showExplanation}
    dataTestId="why-board-hidden-btn"
    style="width: 100%;"
  >
    {$t("newWidget.whyBoardHidden")}
  </StyledButton>

  <StyledButton
    variant="menu"
    size="small"
    on:click={dismissWidget}
    dataTestId="i-know-why-btn"
    style="width: 100%;"
  >
    {$t("newWidget.iKnowWhy")}
  </StyledButton>
</div>

<style>
  .hidden-board-info {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
    background: var(--bg-secondary);
    border-radius: var(--unified-border-radius);
    border: var(--unified-border);
    box-shadow: var(--dynamic-widget-shadow) var(--current-player-shadow-color);
    align-items: center;
  }
</style>
