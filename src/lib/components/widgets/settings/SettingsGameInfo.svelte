<script lang="ts">
    import { gameSettingsStore } from "$lib/stores/gameSettingsStore";
    import { _ } from "svelte-i18n";
    import ButtonGroup from "$lib/components/ui/ButtonGroup.svelte";
    // FIX: Видалено імпорт fitTextAction, оскільки ми використовуємо flex-wrap
</script>

<h3 class="settings-expander__section-title">
    {$_("settings.gameInfoWidget.title")}
</h3>
<!-- FIX: Видалено use:fitTextAction -->
<ButtonGroup
    className="settings-expander__button-group--three"
    options={[
        {
            value: "hidden",
            label: $_("settings.gameInfoWidget.hidden"),
            active: $gameSettingsStore.showGameInfoWidget === "hidden",
            dataTestId: "settings-expander-game-info-widget-hidden-btn",
            onClick: () => gameSettingsStore.setGameInfoWidgetState("hidden"),
        },
        {
            value: "shown",
            label: $_("settings.gameInfoWidget.shown"),
            active: $gameSettingsStore.showGameInfoWidget === "shown",
            dataTestId: "settings-expander-game-info-widget-shown-btn",
            onClick: () => gameSettingsStore.setGameInfoWidgetState("shown"),
        },
        {
            value: "compact",
            label: $_("settings.gameInfoWidget.compact"),
            active: $gameSettingsStore.showGameInfoWidget === "compact",
            dataTestId: "settings-expander-game-info-widget-compact-btn",
            onClick: () => gameSettingsStore.setGameInfoWidgetState("compact"),
        },
    ]}
/>
