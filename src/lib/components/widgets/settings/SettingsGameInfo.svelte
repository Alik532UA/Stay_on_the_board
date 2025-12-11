<script lang="ts">
    import { gameSettingsStore } from "$lib/stores/gameSettingsStore";
    import { _ } from "svelte-i18n";
    import { fitTextAction } from "$lib/actions/fitText";
</script>

<h3 class="settings-expander__section-title">
    {$_("settings.gameInfoWidget.title")}
</h3>
<div
    class="settings-expander__button-group settings-expander__button-group--three"
    use:fitTextAction={$_("settings.gameInfoWidget.hidden")}
>
    <button
        data-testid="settings-expander-game-info-widget-hidden-btn"
        class="settings-expander__row-btn"
        class:active={$gameSettingsStore.showGameInfoWidget === "hidden"}
        on:click={() => gameSettingsStore.setGameInfoWidgetState("hidden")}
    >
        {$_("settings.gameInfoWidget.hidden")}
    </button>
    <button
        data-testid="settings-expander-game-info-widget-shown-btn"
        class="settings-expander__row-btn"
        class:active={$gameSettingsStore.showGameInfoWidget === "shown"}
        on:click={() => gameSettingsStore.setGameInfoWidgetState("shown")}
    >
        {$_("settings.gameInfoWidget.shown")}
    </button>
    <button
        data-testid="settings-expander-game-info-widget-compact-btn"
        class="settings-expander__row-btn"
        class:active={$gameSettingsStore.showGameInfoWidget === "compact"}
        on:click={() => gameSettingsStore.setGameInfoWidgetState("compact")}
    >
        {$_("settings.gameInfoWidget.compact")}
    </button>
</div>
