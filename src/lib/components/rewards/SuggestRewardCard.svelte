<script lang="ts">
    import SvgIcons from "$lib/components/SvgIcons.svelte";
    import { _ } from "svelte-i18n";
    import { modalStore } from "$lib/stores/modalStore";
    import FeedbackModal from "$lib/components/modals/FeedbackModal.svelte";
    import { logService } from "$lib/services/logService";

    function handleClick() {
        logService.action('Click: "Suggest Reward"');
        modalStore.showModal({
            titleKey: "ui.feedback.title",
            dataTestId: "feedback-modal",
            component: FeedbackModal,
            props: { initialType: "reward_suggestion" },
            buttons: [],
        });
    }
</script>

<button
    class="reward-card suggest-card"
    on:click={handleClick}
    data-testid="suggest-reward-card"
>
    <div class="icon-wrapper">
        <SvgIcons name="plus" />
    </div>
    <div class="content">
        <div class="title">{$_("rewards.suggestRewardTitle")}</div>
        <div class="description">{$_("rewards.suggestRewardDescription")}</div>
    </div>
</button>
``

<style>
    /* Reusing styles from RewardCard.svelte via copy-paste to ensure visual consistency 
       without refactoring the original component. */
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
            background 0.2s,
            box-shadow 0.2s;
        text-align: left;
        width: 100%;
        cursor: pointer;
        /* Suggest card is always "unlocked" style */
        opacity: 1;
        filter: none;
        background: linear-gradient(
            145deg,
            var(--bg-secondary),
            rgba(255, 255, 255, 0.05)
        );
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .reward-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
        border-color: var(--text-accent);
    }

    .icon-wrapper {
        width: 64px;
        height: 64px;
        display: flex;
        justify-content: center;
        align-items: center;
        color: var(--text-accent); /* Use accent color for the plus icon */
    }

    /* Make the plus icon large */
    :global(.suggest-card .icon-wrapper svg) {
        width: 40px;
        height: 40px;
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
</style>
