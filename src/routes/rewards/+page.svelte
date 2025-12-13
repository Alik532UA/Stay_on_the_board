<script lang="ts">
    import { rewardsStore } from "$lib/stores/rewardsStore";
    import { ACHIEVEMENTS } from "$lib/services/rewardsService";
    import RewardCard from "$lib/components/rewards/RewardCard.svelte";
    import SuggestRewardCard from "$lib/components/rewards/SuggestRewardCard.svelte";
    import FloatingBackButton from "$lib/components/FloatingBackButton.svelte";
    import { _ } from "svelte-i18n";
    import { onMount, onDestroy } from "svelte";
    import hotkeyService from "$lib/services/hotkeyService";

    // Imports for Leaderboard
    import {
        leaderboardService,
        type LeaderboardEntry,
    } from "$lib/services/leaderboardService";
    import { userProfileStore, authService } from "$lib/services/authService";
    import EditableText from "$lib/components/ui/EditableText.svelte";
    import SvgIcons from "$lib/components/SvgIcons.svelte";

    // Mark unseen as seen when visiting page
    onMount(() => {
        rewardsStore.markAllAsSeen();
        hotkeyService.pushContext("rewards-page");
        loadLeaderboard();
    });

    onDestroy(() => {
        hotkeyService.popContext();
    });

    $: unlockedMap = $rewardsStore.unlockedRewards;

    // Leaderboard State
    let leaders: LeaderboardEntry[] = [];
    let isLoadingLeaders = true;

    async function loadLeaderboard() {
        isLoadingLeaders = true;
        // ВИПРАВЛЕНО: Передаємо режим 'timed' та розмір дошки 4
        // У майбутньому тут можна додати селектор розміру дошки
        leaders = await leaderboardService.getTopPlayers("timed", 4, 10);
        isLoadingLeaders = false;
    }

    function handleNameChange(e: CustomEvent<string>) {
        authService.updateNickname(e.detail);
    }
</script>

<div class="rewards-page">
    <div class="header">
        <FloatingBackButton />
        <h1>{$_("rewards.pageTitle")}</h1>
        <div class="spacer"></div>
    </div>

    <div class="content-wrapper">
        <!-- Секція 1: Особистий рекорд -->
        <div class="personal-best-section">
            <div class="pb-card">
                <div class="pb-icon">
                    <SvgIcons name="stopwatch_gold" />
                </div>
                <div class="pb-info">
                    <div class="pb-label">Мій рекорд (Гра на час)</div>
                    <div class="pb-value">
                        {$userProfileStore?.bestTimeScore || 0}
                    </div>
                    <div class="pb-name">
                        <span class="label">Ім'я в рейтингу:</span>
                        <EditableText
                            value={$userProfileStore?.displayName || "Player"}
                            canEdit={true}
                            onRandom={() =>
                                `Player ${Math.floor(Math.random() * 1000)}`}
                            on:change={handleNameChange}
                        />
                    </div>
                </div>
            </div>
        </div>

        <!-- Секція 2: Таблиця лідерів -->
        <div class="leaderboard-section">
            <h2>Топ гравців (Гра на час 4x4)</h2>
            <div class="leaderboard-table-wrapper">
                {#if isLoadingLeaders}
                    <div class="loading">Завантаження рейтингу...</div>
                {:else if leaders.length === 0}
                    <div class="empty">
                        Поки що немає рекордів. Станьте першим!
                    </div>
                {:else}
                    <table class="leaderboard-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Гравець</th>
                                <th>Рахунок</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each leaders as leader, i}
                                <tr
                                    class:me={leader.uid ===
                                        $userProfileStore?.uid}
                                >
                                    <td class="rank">
                                        {#if i === 0}🥇{:else if i === 1}🥈{:else if i === 2}🥉{:else}{i +
                                                1}{/if}
                                    </td>
                                    <td class="name">{leader.displayName}</td>
                                    <td class="score">{leader.score}</td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                {/if}
            </div>
        </div>

        <hr class="divider" />

        <!-- Секція 3: Досягнення -->
        <h2>Досягнення</h2>
        <div class="rewards-grid">
            {#each ACHIEVEMENTS as achievement (achievement.id)}
                <RewardCard
                    {achievement}
                    unlockedInfo={unlockedMap[achievement.id]}
                />
            {/each}

            <SuggestRewardCard />
        </div>
    </div>
</div>

<style>
    .rewards-page {
        height: 100vh;
        padding: 20px;
        display: flex;
        flex-direction: column;
        background: var(--bg-primary);
        color: var(--text-primary);
        box-sizing: border-box;
        overflow-y: auto;
    }

    .content-wrapper {
        max-width: 800px;
        margin: 0 auto;
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 30px;
    }

    .header {
        display: flex;
        align-items: center;
        margin-bottom: 10px;
        position: relative;
        justify-content: space-between;
    }

    h1,
    h2 {
        font-family: "M PLUS Rounded 1c", sans-serif;
        text-align: center;
        margin: 0;
        color: var(--text-accent);
    }

    h1 {
        font-size: 1.8rem;
        flex: 1;
    }
    h2 {
        font-size: 1.4rem;
        margin-bottom: 10px;
        text-align: left;
    }

    .spacer {
        width: 48px;
    }
    .divider {
        border: 0;
        border-top: 1px solid var(--border-color);
        opacity: 0.3;
    }

    /* Personal Best Card */
    .pb-card {
        background: linear-gradient(
            135deg,
            rgba(255, 215, 0, 0.1),
            rgba(255, 165, 0, 0.05)
        );
        border: 1px solid rgba(255, 215, 0, 0.3);
        border-radius: 16px;
        padding: 20px;
        display: flex;
        align-items: center;
        gap: 20px;
    }

    .pb-icon {
        width: 60px;
        height: 60px;
        color: gold;
    }

    .pb-info {
        flex: 1;
    }

    .pb-label {
        font-size: 0.9em;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 1px;
    }
    .pb-value {
        font-size: 2.5em;
        font-weight: 800;
        color: var(--text-primary);
        line-height: 1.1;
    }
    .pb-name {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-top: 5px;
        font-size: 0.9em;
    }
    .pb-name .label {
        color: var(--text-secondary);
    }

    /* Leaderboard Table */
    .leaderboard-table-wrapper {
        background: var(--bg-secondary);
        border-radius: 12px;
        overflow: hidden;
        box-shadow: var(--unified-shadow);
        border: 1px solid var(--border-color);
    }

    .leaderboard-table {
        width: 100%;
        border-collapse: collapse;
    }

    .leaderboard-table th,
    .leaderboard-table td {
        padding: 12px 16px;
        text-align: left;
    }

    .leaderboard-table th {
        background: rgba(0, 0, 0, 0.2);
        font-weight: 600;
        color: var(--text-secondary);
        font-size: 0.9em;
    }

    .leaderboard-table tr {
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .leaderboard-table tr:last-child {
        border-bottom: none;
    }

    .leaderboard-table tr.me {
        background: rgba(var(--text-accent-rgb), 0.1);
        font-weight: bold;
    }

    .rank {
        width: 40px;
        text-align: center;
        font-size: 1.2em;
    }
    .score {
        text-align: right;
        font-weight: bold;
        color: var(--text-accent);
        font-size: 1.1em;
    }

    .loading,
    .empty {
        padding: 20px;
        text-align: center;
        color: var(--text-secondary);
        font-style: italic;
    }

    .rewards-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 16px;
    }

    @media (max-width: 600px) {
        .rewards-grid {
            grid-template-columns: 1fr;
        }
        .pb-card {
            flex-direction: column;
            text-align: center;
        }
        .pb-name {
            justify-content: center;
            flex-direction: column;
            gap: 5px;
        }
    }
</style>
