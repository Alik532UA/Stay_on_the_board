<script lang="ts">
    import { _ } from "svelte-i18n";
    import GameModeButton from "$lib/components/game-modes/GameModeButton.svelte";
    import NotoEmoji from "$lib/components/NotoEmoji.svelte";
    import type { FeedbackType } from "$lib/services/feedbackService";
    import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher();

    function selectType(type: FeedbackType) {
        dispatch("select", type);
    }

    function handleGlobalChat() {
        dispatch("globalChat");
    }
</script>

<div class="menu-list">
    <!-- 1. Запропонувати покращення -->
    <GameModeButton
        text={$_("ui.feedback.typeImprovement")}
        dataTestId="fb-type-improvement"
        on:click={() => selectType("improvement")}
    >
        <div slot="icon">
            <NotoEmoji name="light_bulb" size="100%" />
        </div>
    </GameModeButton>

    <!-- 2. Повідомити про проблему -->
    <GameModeButton
        text={$_("ui.feedback.typeBug")}
        dataTestId="fb-type-bug"
        on:click={() => selectType("bug")}
    >
        <div slot="icon"><NotoEmoji name="bug" size="100%" /></div>
    </GameModeButton>

    <!-- 3. Запропонувати нагороду -->
    <GameModeButton
        text={$_("ui.feedback.typeReward")}
        dataTestId="fb-type-reward"
        on:click={() => selectType("reward_suggestion")}
    >
        <div slot="icon"><NotoEmoji name="trophy" size="100%" /></div>
    </GameModeButton>

    <!-- 4. Інше -->
    <GameModeButton
        text={$_("ui.feedback.typeOther")}
        dataTestId="fb-type-other"
        on:click={() => selectType("other")}
    >
        <div slot="icon">
            <NotoEmoji name="thought_balloon" size="100%" />
        </div>
    </GameModeButton>

    <!-- Розділювач -->
    <div class="divider"></div>

    <!-- 5. Спільний чат -->
    <GameModeButton
        text={$_("ui.feedback.typeGlobalChat")}
        dataTestId="fb-type-global-chat"
        on:click={handleGlobalChat}
    >
        <div slot="icon">
            <NotoEmoji name="speech_balloon" size="100%" />
        </div>
    </GameModeButton>
</div>

<style>
    .menu-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
        width: 100%;
    }

    .divider {
        height: 1px;
        background: rgba(255, 255, 255, 0.15);
        margin: 8px 0;
        width: 100%;
    }
</style>
