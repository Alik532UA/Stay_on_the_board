<script lang="ts">
    import SvgIcons from "$lib/components/SvgIcons.svelte";
    import { _, locale } from "svelte-i18n";
    import type { Achievement } from "$lib/types/rewards";
    import type { UnlockedReward } from "$lib/types/rewards";
    import { formatDate } from "$lib/utils/dateUtils";

    export let achievement: Achievement;
    export let unlockedInfo: UnlockedReward | undefined = undefined;

    $: isUnlocked = !!unlockedInfo;
    $: dateString = unlockedInfo
        ? formatDate(unlockedInfo.unlockedAt, $locale)
        : "";
</script>

<div
    class="reward-card"
    class:unlocked={isUnlocked}
    data-testid={`reward-card-${achievement.id}`}
>
    <div class="icon-wrapper">
        <SvgIcons name={achievement.icon} />
    </div>
    <div class="content">
        <div class="title">{$_(achievement.titleKey)}</div>
        {#if isUnlocked || !achievement.isHidden}
            <div class="description">{$_(achievement.descriptionKey)}</div>
        {:else}
            <div class="description hidden-text">???</div>
        {/if}
        {#if isUnlocked}
            <div class="date">
                {$_("rewards.unlockedOn", { values: { date: dateString } })}
            </div>
        {/if}
    </div>
    {#if !isUnlocked}
        <div class="lock-overlay">
            <SvgIcons name="lock" />
        </div>
    {/if}
</div>

<style>
    .reward-card {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px;
        border-radius: 12px;
        background: var(--bg-secondary);
        border: 1px solid rgba(255, 255, 255, 0.1);
        position: relative;
        overflow: hidden;
        transition:
            transform 0.2s,
            background 0.2s;
        opacity: 0.5; /* Default opacity for locked */
        filter: grayscale(0.8);
    }

    .reward-card.unlocked {
        opacity: 1;
        filter: none;
        background: linear-gradient(
            145deg,
            var(--bg-secondary),
            rgba(255, 255, 255, 0.05)
        );
        border: 1px solid var(--accent-color);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .icon-wrapper {
        width: 64px;
        height: 64px;
        display: flex;
        justify-content: center;
        align-items: center;
        /* Icon styling handled by SvgIcons global styles or fill/stroke */
        color: var(--accent-color);
    }

    .content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .title {
        font-weight: bold;
        font-size: 1.1em;
        color: var(--text-primary);
    }

    .description {
        font-size: 0.9em;
        color: var(--text-secondary);
    }

    .date {
        font-size: 0.8em;
        color: var(--text-accent);
        margin-top: 4px;
        font-style: italic;
    }

    /* Lock overlay for locked cards */
    .lock-overlay {
        position: absolute;
        top: 8px;
        right: 8px;
        width: 24px;
        height: 24px;
        opacity: 0.6;
    }
</style>
