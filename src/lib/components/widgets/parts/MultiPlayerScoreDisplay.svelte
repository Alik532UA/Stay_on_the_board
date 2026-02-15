<script lang="ts">
    import { t } from "$lib/i18n/typedI18n";
    import { modalStore } from "$lib/stores/modalStore";
    import SimpleModalContent from "../../modals/SimpleModalContent.svelte";
    import { customTooltip } from "$lib/actions/customTooltip.js";
    import type { ScoreState } from "$lib/stores/scoreStore";
    import type { Player } from "$lib/models/player";

    export let players: Player[] = [];
    export let scoreStore: ScoreState;

    function getPlayerColor(playerName: string) {
        const player = players.find((p) => p.name === playerName);
        return player ? player.color : null;
    }

    function getPlayerNameStyle(playerName: string) {
        const color = getPlayerColor(playerName);
        if (color) {
            return `background-color: ${color};`;
        }
        return "";
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

    function showPlayerBonusInfo(player: Player) {
        let scoreDetails = "";

        scoreDetails +=
            $t("modal.scoreDetails.distanceBonusLabel", {
                bonus: player.bonusPoints || 0,
            }) + "\n";
        scoreDetails +=
            $t("modal.scoreDetails.jumpBonusLabel", { bonus: 0 }) + "\n";
        scoreDetails +=
            $t("modal.scoreDetails.reversePenaltyLabel", {
                penalty: player.penaltyPoints || 0,
            }) + "\n";

        const totalScore =
            (player.bonusPoints || 0) - (player.penaltyPoints || 0);
        scoreDetails +=
            "\n" + $t("modal.scoreDetails.totalSum", { total: totalScore });

        modalStore.showModal({
            component: SimpleModalContent,
            variant: "menu",
            dataTestId: `player-score-details-modal-${player.name}`,
            props: {
                title: $t("modal.scoreDetails.title", {
                    playerName: player.name,
                }),
                content: scoreDetails,
                actions: [
                    {
                        labelKey: "modal.ok",
                        variant: "primary",
                        isHot: true,
                        onClick: () => modalStore.closeModal(),
                        dataTestId: "player-score-details-ok-btn",
                    },
                ],
            },
        });
    }
</script>

<!-- FIX: Додано data-testid для контейнера -->
<div
    class="score-display-multiplayer"
    data-testid="multiplayer-score-container"
>
    <div class="score-label-multiplayer">{$t("gameBoard.scoreLabel")}</div>
    {#each players as player}
        <!-- FIX: Додано data-testid для рядка гравця -->
        <div class="score-row" data-testid={`score-row-${player.id}`}>
            <span
                class="player-name-plate"
                style={getPlayerNameStyle(player.name)}>{player.name}</span
            >
            <div class="score-compound">
                <span
                    class="score-value-clickable fixed-score"
                    on:click={() => showPlayerBonusInfo(player)}
                    on:keydown={(e) =>
                        (e.key === "Enter" || e.key === " ") &&
                        showPlayerBonusInfo(player)}
                    role="button"
                    tabindex="0"
                    use:customTooltip={$t("gameBoard.details")}
                    data-testid={`score-value-${player.id}`}
                    >{player.score}</span
                >
                {#if player.roundScore && player.roundScore > 0}
                    <span
                        class="round-score"
                        data-testid={`round-score-${player.id}`}
                        >+{player.roundScore}</span
                    >
                {/if}
            </div>
        </div>
    {/each}
    {#if scoreStore && scoreStore.penaltyPoints > 0}
        <div class="score-row">
            <span
                class="penalty-display"
                on:click={showPenaltyInfo}
                on:keydown={(e) =>
                    (e.key === "Enter" || e.key === " ") && showPenaltyInfo()}
                use:customTooltip={$t("gameBoard.penaltyHint")}
                role="button"
                tabindex="0"
                data-testid="penalty-display"
                >{$t("modal.scoreDetails.penalty")}: -{scoreStore.penaltyPoints}</span
            >
        </div>
    {/if}
</div>

<style>
    .score-display-multiplayer {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
    }

    .score-row {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.9em;
    }

    .score-label-multiplayer {
        font-weight: bold;
        margin-bottom: 4px;
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
    .score-compound {
        display: flex;
        align-items: center;
        gap: 4px;
    }

    .player-name-plate {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 12px;
        color: #ffffff;
        font-weight: bold;
        text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.6);
        border: var(--global-border-width) solid rgba(255, 255, 255, 0.3);
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
        transition: all 0.3s ease;
    }
    .round-score {
        color: #4caf50; /* Green for current round points */
        font-size: 0.9em;
        font-weight: bold;
        animation: fadeIn 0.3s ease-in;
    }
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(2px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
</style>
