<script lang="ts">
    import { rewardsStore } from "$lib/stores/rewardsStore";
    import { ACHIEVEMENTS } from "$lib/services/rewardsService";
    import RewardCard from "$lib/components/rewards/RewardCard.svelte";
    import SuggestRewardCard from "$lib/components/rewards/SuggestRewardCard.svelte";
    import FloatingBackButton from "$lib/components/FloatingBackButton.svelte";
    import { _ } from "svelte-i18n";
    import { onMount, onDestroy } from "svelte";
    import hotkeyService from "$lib/services/hotkeyService";

    // Mark unseen as seen when visiting page
    onMount(() => {
        rewardsStore.markAllAsSeen();
        hotkeyService.pushContext("rewards-page");
    });

    onDestroy(() => {
        hotkeyService.popContext();
    });

    $: unlockedMap = $rewardsStore.unlockedRewards;
</script>

<div class="rewards-page">
    <div class="header">
        <FloatingBackButton />
        <h1>{$_("rewards.pageTitle")}</h1>
        <div class="spacer"></div>
    </div>

    <div class="rewards-grid">
        {#each ACHIEVEMENTS as achievement (achievement.id)}
            <RewardCard
                {achievement}
                unlockedInfo={unlockedMap[achievement.id]}
            />
        {/each}

        <!-- Кнопка пропозиції нагороди в кінці списку -->
        <SuggestRewardCard />
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

    .header {
        display: flex;
        align-items: center;
        margin-bottom: 24px;
        position: relative;
        justify-content: space-between;
    }

    h1 {
        font-family: "M PLUS Rounded 1c", sans-serif;
        text-align: center;
        margin: 0;
        flex: 1;
        font-size: 1.5rem;
        color: var(--text-accent);
    }

    .spacer {
        width: 48px; /* Approximate width of back button to center title */
    }

    .rewards-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 16px;
        max-width: 1200px;
        margin: 0 auto;
        width: 100%;
    }

    @media (max-width: 600px) {
        .rewards-grid {
            grid-template-columns: 1fr;
        }
    }
</style>
