<script lang="ts">
    import { t } from "$lib/i18n/typedI18n";
    import { modalStore } from "$lib/stores/modalStore";
    import FeedbackModal from "$lib/components/modals/FeedbackModal.svelte";
    import { logService } from "$lib/services/logService";
    import NotoEmoji from "$lib/components/NotoEmoji.svelte"; // Імпорт

    function handleClick() {
        logService.action('Click: "Suggest Reward"');
        modalStore.showModal({
            titleKey: "ui.feedback.title",
            dataTestId: "feedback-modal",
            component: FeedbackModal,
            props: { initialType: "reward_suggestion" },
            variant: "menu",
            buttons: [],
            closeOnOverlayClick: true,
        });
    }
</script>

<button
    class="reward-card suggest-card"
    on:click={handleClick}
    data-testid="suggest-reward-card"
>
    <div class="icon-wrapper">
        <!-- Заміна SvgIcons на NotoEmoji -->
        <NotoEmoji name="plus" size="40px" />
    </div>
    <div class="content">
        <div class="title">{$t("rewards.suggestRewardTitle")}</div>
        <div class="description">{$t("rewards.suggestRewardDescription")}</div>
    </div>
</button>

<style>
    /* Стилі залишаються без змін, крім видалення :global(.suggest-card .icon-wrapper svg) */
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
            background 0.2s,
            box-shadow 0.2s;
        text-align: left;
        width: 100%;
        cursor: pointer;
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
        color: var(--text-accent);
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
