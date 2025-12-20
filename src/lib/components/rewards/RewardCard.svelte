<script lang="ts">
    import { _, locale } from "svelte-i18n";
    import type { Achievement } from "$lib/types/rewards";
    import type { UnlockedReward } from "$lib/types/rewards";
    import { formatDate } from "$lib/utils/dateUtils";
    import { customTooltip } from "$lib/actions/customTooltip";
    import NotoEmoji from "$lib/components/NotoEmoji.svelte"; // Імпорт

    export let achievement: Achievement;
    export let unlockedInfo: UnlockedReward | UnlockedReward[] | undefined =
        undefined;

    $: isGroup = Array.isArray(unlockedInfo);

    $: mainUnlock = isGroup
        ? (unlockedInfo as UnlockedReward[]).sort(
              (a, b) => b.unlockedAt - a.unlockedAt,
          )[0]
        : (unlockedInfo as UnlockedReward);

    $: isUnlocked = !!mainUnlock;

    $: dateString = mainUnlock
        ? formatDate(mainUnlock.unlockedAt, $locale)
        : "";

    $: tooltipText = isGroup
        ? (unlockedInfo as UnlockedReward[])
              .map((u) => {
                  const parts = u.id.split("_");
                  const size = parts[parts.length - 1];
                  return !isNaN(Number(size)) ? `${size}x${size}` : size;
              })
              .sort((a, b) => parseInt(a) - parseInt(b))
              .join(", ")
        : "";

    $: badgeLabel = (() => {
        if (isGroup) {
            const rewards = unlockedInfo as UnlockedReward[];
            if (rewards.length > 1) {
                return rewards.length;
            } else if (rewards.length === 1) {
                const idParts = rewards[0].id.split("_");
                const size = idParts[idParts.length - 1];
                return !isNaN(Number(size)) ? `${size}x${size}` : size;
            }
        }
        return achievement.variantLabel;
    })();

    $: showTooltip = isGroup && (unlockedInfo as UnlockedReward[]).length > 1;
</script>

<div
    class="reward-card"
    class:unlocked={isUnlocked}
    data-testid={`reward-card-${achievement.id}`}
>
    <div class="icon-wrapper">
        <!-- Заміна SvgIcons на NotoEmoji -->
        <NotoEmoji name={achievement.icon} size="64px" />
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
            <!-- Заміна SvgIcons на NotoEmoji -->
            <NotoEmoji name="locked" size="24px" />
        </div>
    {:else if badgeLabel}
        <div
            class="variant-badge"
            class:count-badge={showTooltip}
            use:customTooltip={showTooltip
                ? `Отримано на дошках: ${tooltipText}`
                : ""}
        >
            {badgeLabel}
        </div>
    {/if}
</div>

<style>
    /* Стилі залишаються без змін */
    .reward-card {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px;
        border-radius: 12px;
        background: var(--bg-secondary);
        border: var(--global-border-width) solid rgba(255, 255, 255, 0.1);
        position: relative;
        overflow: hidden;
        transition:
            transform 0.2s,
            background 0.2s;
        opacity: 0.5;
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
        border: var(--global-border-width) solid var(--accent-color);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .icon-wrapper {
        width: 64px;
        height: 64px;
        display: flex;
        justify-content: center;
        align-items: center;
        /* color: var(--accent-color); - NotoEmoji має свої кольори */
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

    .lock-overlay {
        position: absolute;
        top: 8px;
        right: 8px;
        width: 24px;
        height: 24px;
        opacity: 0.6;
    }

    .variant-badge {
        position: absolute;
        top: 8px;
        right: 8px;
        background: rgba(255, 255, 255, 0.1);
        border: var(--global-border-width) solid var(--text-accent);
        color: var(--text-accent);
        font-size: 0.75em;
        font-weight: bold;
        padding: 2px 6px;
        border-radius: 6px;
    }

    .count-badge {
        background: var(--text-accent);
        color: var(--bg-secondary);
        border-radius: 50%;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        cursor: help;
    }
</style>
