<script lang="ts">
    import { _ } from "svelte-i18n";
    import { modalStore } from "$lib/stores/modalStore";
    import SimpleModalContent from "../../modals/SimpleModalContent.svelte";
    import { customTooltip } from "$lib/actions/customTooltip.js";
    import type { ScoreState } from "$lib/stores/scoreStore";

    export let score: number = 0;
    export let scoreStore: ScoreState;

    function showScoreInfo() {
        modalStore.showModal({
            component: SimpleModalContent,
            variant: "menu",
            dataTestId: "score-info-modal",
            props: {
                titleKey: "modal.scoreInfoTitle",
                contentKey: "modal.scoreInfoContent",
                actions: [
                    {
                        labelKey: "modal.ok",
                        variant: "primary",
                        isHot: true,
                        onClick: () => modalStore.closeModal(),
                        dataTestId: "score-info-ok-btn",
                    },
                ],
            },
        });
    }

    function showPenaltyInfo() {
        modalStore.showModal({
            component: SimpleModalContent,
            variant: "menu",
            dataTestId: "penalty-info-modal",
            props: {
                titleKey: "gameBoard.penaltyInfoTitle",
                contentKey: "gameBoard.penaltyHint",
                actions: [
                    {
                        labelKey: "modal.ok",
                        variant: "primary",
                        isHot: true,
                        onClick: () => modalStore.closeModal(),
                        dataTestId: "penalty-info-ok-btn",
                    },
                ],
            },
        });
    }
</script>

<div class="score-display">
    <span class="score-label-text">
        {$_("gameBoard.scoreLabel")}:
    </span>
    <span
        class="score-value-clickable"
        class:positive-score={score > 0}
        on:click={showScoreInfo}
        on:keydown={(e) =>
            (e.key === "Enter" || e.key === " ") && showScoreInfo()}
        role="button"
        tabindex="0"
        use:customTooltip={$_("modal.scoreInfoTitle")}
        data-testid="score-value">{score}</span
    >
    {#if scoreStore && scoreStore.penaltyPoints > 0}
        <span
            class="penalty-display"
            on:click={showPenaltyInfo}
            on:keydown={(e) =>
                (e.key === "Enter" || e.key === " ") && showPenaltyInfo()}
            use:customTooltip={$_("gameBoard.penaltyHint")}
            role="button"
            tabindex="0"
            data-testid="penalty-display">- {scoreStore.penaltyPoints}</span
        >
    {/if}
</div>

<style>
    .score-display {
        display: flex;
        align-items: center;
        gap: 16px;
    }

    .score-value-clickable {
        cursor: pointer;
        text-decoration: none;
        transition:
            color 0.2s,
            text-shadow 0.2s;
    }
    .score-value-clickable:hover,
    .score-value-clickable:focus {
        color: var(--text-accent, #ff9800);
        text-shadow: 0 0 8px var(--shadow-color);
        outline: none;
    }
    .positive-score {
        color: var(--positive-score-color, #4caf50);
        font-weight: bold;
    }
    .penalty-display {
        color: var(--error-color);
        font-weight: bold;
        cursor: pointer;
        transition:
            color 0.2s,
            transform 0.2s;
        border-radius: 4px;
        padding: 2px 6px;
    }
    .penalty-display:hover {
        color: #d32f2f;
        transform: scale(1.1);
        background: rgba(244, 67, 54, 0.1);
    }
</style>
