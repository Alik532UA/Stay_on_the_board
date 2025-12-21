<script lang="ts">
    import { _ } from "svelte-i18n";
    import { modalStore } from "$lib/stores/modalStore";
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
            titleKey: "gameBoard.penaltyInfoTitle",
            contentKey: "gameBoard.penaltyHint",
            buttons: [{ textKey: "modal.ok", primary: true, isHot: true }],
            dataTestId: "penalty-info-modal",
        });
    }

    function showPlayerBonusInfo(player: any) {
        let scoreDetails = "";
        if (player.bonusPoints > 0) {
            scoreDetails += `Бонус за відстань: +${player.bonusPoints}\n`;
            scoreDetails += `Бонус за перестрибування: +0\n`;
        } else {
            scoreDetails += `Бонус за відстань: +0\n`;
            scoreDetails += `Бонус за перестрибування: +0\n`;
        }
        scoreDetails += `Штраф за зворотній хід: -${player.penaltyPoints}\n`;
        const totalScore = player.bonusPoints - player.penaltyPoints;
        scoreDetails += `\nЗагальна сума балів: ${totalScore}`;

        modalStore.showModal({
            title: `Поточні бали ${player.name}`,
            content: scoreDetails,
            buttons: [{ textKey: "modal.ok", primary: true, isHot: true }],
            dataTestId: `player-score-details-modal-${player.name}`,
        });
    }
</script>

<!-- FIX: Додано data-testid для контейнера -->
<div
    class="score-display-multiplayer"
    data-testid="multiplayer-score-container"
>
    <div class="score-label-multiplayer">{$_("gameBoard.scoreLabel")}</div>
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
                    use:customTooltip={"Натисніть для перегляду деталей балів"}
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
                use:customTooltip={$_("gameBoard.penaltyHint")}
                role="button"
                tabindex="0"
                data-testid="penalty-display"
                >Штраф: -{scoreStore.penaltyPoints}</span
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
