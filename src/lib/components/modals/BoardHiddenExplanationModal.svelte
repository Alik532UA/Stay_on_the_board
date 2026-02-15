<script lang="ts">
    import { t } from "$lib/i18n/typedI18n";
    import StyledButton from "$lib/components/ui/StyledButton.svelte";
    import { modalStore } from "$lib/stores/modalStore";

    export let dataTestId = "board-hidden-explanation-modal";
</script>

<div class="board-explanation-content" data-testid={`${dataTestId}-content`}>
    <h2 class="modal-title-menu" data-testid={`${dataTestId}-title`}>
        {$t("modal.boardHiddenExplanationTitle")}
    </h2>

    <div class="message-text">
        <p>{$t("modal.boardHiddenExplanation.p1")}</p>
        <p>{$t("modal.boardHiddenExplanation.p2")}</p>
        <p>{$t("modal.boardHiddenExplanation.p3")}</p>
    </div>

    <div class="actions-column">
        <StyledButton
            variant="primary"
            size="large"
            on:click={() => modalStore.closeModal()}
            dataTestId={`${dataTestId}-ok-btn`}
        >
            {$t("modal.ok")}
        </StyledButton>
    </div>
</div>

<style>
    .board-explanation-content {
        display: flex;
        flex-direction: column;
        gap: 20px;
        width: 100%;
        box-sizing: border-box;
    }

    .modal-title-menu {
        text-align: center;
        font-size: 1.8em;
        font-weight: 800;
        color: #fff;
        margin: 0;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }

    .message-text {
        text-align: center;
        color: rgba(255, 255, 255, 0.9);
        font-size: 1.1em;
        margin: 0;
    }

    .actions-column {
        display: flex;
        flex-direction: column;
        margin-top: 10px;
    }
</style>
