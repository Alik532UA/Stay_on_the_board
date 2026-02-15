<script lang="ts">
    import { rewardsStore } from "$lib/stores/rewardsStore";
    import { ACHIEVEMENTS } from "$lib/services/rewardsService";
    import RewardCard from "$lib/components/rewards/RewardCard.svelte";
    import SuggestRewardCard from "$lib/components/rewards/SuggestRewardCard.svelte";
    import FloatingBackButton from "$lib/components/FloatingBackButton.svelte";
    import PersonalBestSection from "$lib/components/rewards/PersonalBestSection.svelte";
    import LeaderboardSection from "$lib/components/rewards/LeaderboardSection.svelte";
    import { t } from "$lib/i18n/typedI18n";
    import { onMount, onDestroy } from "svelte";
    import hotkeyService from "$lib/services/hotkeyService";
    import type { UnlockedReward, Achievement } from "$lib/types/rewards";

    onMount(() => {
        rewardsStore.markAllAsSeen();
        hotkeyService.pushContext("rewards-page");
    });

    onDestroy(() => {
        hotkeyService.popContext();
    });

    $: unlockedMap = $rewardsStore.unlockedRewards;

    // --- Achievements Grouping Logic ---

    $: displayAchievements = groupAchievements(ACHIEVEMENTS, unlockedMap);

    function groupAchievements(
        all: Achievement[],
        unlocked: Record<string, UnlockedReward>,
    ) {
        const groups: Record<
            string,
            { achievement: Achievement; unlocked: UnlockedReward[] }
        > = {};
        const singles: {
            achievement: Achievement;
            unlocked: UnlockedReward | undefined;
        }[] = [];

        all.forEach((ach) => {
            if (ach.groupId) {
                if (!groups[ach.groupId]) {
                    groups[ach.groupId] = { achievement: ach, unlocked: [] };
                }
                if (unlocked[ach.id]) {
                    groups[ach.groupId].unlocked.push(unlocked[ach.id]);
                }
            } else {
                singles.push({ achievement: ach, unlocked: unlocked[ach.id] });
            }
        });

        const groupItems = Object.values(groups).map((g) => ({
            achievement: g.achievement,
            unlocked: g.unlocked.length > 0 ? g.unlocked : undefined,
        }));

        return [...singles, ...groupItems];
    }
</script>

<div class="rewards-page">
    <div class="header">
        <FloatingBackButton />
        <h1>{$t("rewards.pageTitle")}</h1>
        <div class="spacer"></div>
    </div>

    <div class="content-wrapper">
        <!-- Секція 1: Особистий рекорд -->
        <PersonalBestSection />

        <!-- Секція 2: Таблиця лідерів -->
        <LeaderboardSection />

        <hr class="divider" />

        <!-- Секція 3: Досягнення -->
        <h2>Досягнення</h2>
        <div class="rewards-grid">
            {#each displayAchievements as item}
                <RewardCard
                    achievement={item.achievement}
                    unlockedInfo={item.unlocked}
                />
            {/each}

            <SuggestRewardCard />
        </div>
    </div>
</div>

<style>
    .rewards-page {
        /* FIX: Видалено фіксовану висоту та внутрішній скрол */
        min-height: 100vh;
        padding: 20px;
        display: flex;
        flex-direction: column;
        background: var(--bg-primary);
        color: var(--text-primary);
        box-sizing: border-box;
    }

    .content-wrapper {
        max-width: 800px;
        margin: 0 auto;
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 30px;
        /* Додаємо відступ знизу, щоб контент не прилипав до краю екрану */
        padding-bottom: 40px;
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

    .rewards-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 16px;
    }

    @media (max-width: 600px) {
        .rewards-grid {
            grid-template-columns: 1fr;
        }
    }
</style>
