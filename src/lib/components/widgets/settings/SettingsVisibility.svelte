<script lang="ts">
    import { gameSettingsStore } from "$lib/stores/gameSettingsStore";
    import { _ } from "svelte-i18n";
    import ButtonGroup from "$lib/components/ui/ButtonGroup.svelte";
    // FIX: Видалено імпорт fitTextAction
    import { get } from "svelte/store";

    export let isCompetitiveMode = false;

    const toggleFunctions = [
        () =>
            gameSettingsStore.updateSettings({
                showBoard: false,
                showPiece: false,
                showMoves: false,
            }),
        () => {
            const current = get(gameSettingsStore).showBoard;
            if (!current) {
                gameSettingsStore.updateSettings({ showBoard: true });
            }
        },
        () => {
            const current = get(gameSettingsStore).showPiece;
            if (current) {
                gameSettingsStore.updateSettings({
                    showPiece: false,
                    showMoves: false,
                });
            } else {
                gameSettingsStore.updateSettings({
                    showBoard: true,
                    showPiece: true,
                });
            }
        },
        () => {
            const current = get(gameSettingsStore).showMoves;
            if (current) {
                gameSettingsStore.updateSettings({ showMoves: false });
            } else {
                gameSettingsStore.updateSettings({
                    showBoard: true,
                    showPiece: true,
                    showMoves: true,
                });
            }
        },
    ];

    function getIsActive(i: number, settings: any) {
        switch (i) {
            case 0:
                return !settings.showBoard;
            case 1:
                return settings.showBoard;
            case 2:
                return settings.showPiece;
            case 3:
                return settings.showMoves;
            default:
                return false;
        }
    }
</script>

<!-- FIX: Видалено use:fitTextAction -->
<ButtonGroup
    options={[
        $_("settings.visibility.hidden"),
        $_("settings.visibility.boardOnly"),
        $_("settings.visibility.withPiece"),
        $_("settings.visibility.withMoves"),
    ].map((label, i) => ({
        label,
        active: getIsActive(i, $gameSettingsStore),
        dataTestId: `settings-expander-visibility-btn-${i}`,
        onClick: toggleFunctions[i],
    }))}
    className={isCompetitiveMode ? "locked-setting" : ""}
/>
