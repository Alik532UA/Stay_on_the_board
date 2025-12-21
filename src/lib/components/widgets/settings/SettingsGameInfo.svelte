<script lang="ts">
    import { gameSettingsStore } from "$lib/stores/gameSettingsStore";
    import { _ } from "svelte-i18n";
    import ButtonGroup from "$lib/components/ui/ButtonGroup.svelte";
</script>

<h3
    class="settings-expander__section-title"
    data-testid="settings-game-info-title"
>
    {$_("settings.gameInfoWidget.title")}
</h3>

<!-- FIX: Додано dataTestId для контейнера групи -->
<ButtonGroup
    className="settings-expander__button-group--three"
    dataTestId="settings-game-info-group"
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
