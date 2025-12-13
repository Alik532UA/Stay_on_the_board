<script lang="ts">
    import { gameSettingsStore } from "$lib/stores/gameSettingsStore";
    import { _ } from "svelte-i18n";
    import { fitTextAction } from "$lib/actions/fitText";
    import { get } from "svelte/store";

    export let isCompetitiveMode = false;

    // Видалено масив icons, оскільки іконки тут не потрібні

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

<div
    class="settings-expander__button-group"
    class:locked-setting={isCompetitiveMode}
    use:fitTextAction={$_("settings.visibility.hidden")}
>
    {#each [$_("settings.visibility.hidden"), $_("settings.visibility.boardOnly"), $_("settings.visibility.withPiece"), $_("settings.visibility.withMoves")] as label, i}
        <button
            data-testid="settings-expander-visibility-btn-{i}"
            class="settings-expander__row-btn"
            class:active={getIsActive(i, $gameSettingsStore)}
            on:click={toggleFunctions[i]}
            disabled={isCompetitiveMode}
        >
            <!-- Видалено SvgIcons -->
            {label}
        </button>
    {/each}
</div>
