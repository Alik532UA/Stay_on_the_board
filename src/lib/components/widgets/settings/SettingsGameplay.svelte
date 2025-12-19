<script lang="ts">
    import { gameSettingsStore } from "$lib/stores/gameSettingsStore";
    import { gameModeStore } from "$lib/stores/gameModeStore";
    import { modalStore } from "$lib/stores/modalStore";
    import { userActionService } from "$lib/services/userActionService";
    import { gameModeService } from "$lib/services/gameModeService";
    import { uiStateStore } from "$lib/stores/uiStateStore";
    import { logService } from "$lib/services/logService";
    import { _ } from "svelte-i18n";
    import ToggleButton from "$lib/components/ToggleButton.svelte";
    import ButtonGroup from "$lib/components/ui/ButtonGroup.svelte";
    // FIX: Видалено імпорт fitTextAction
    import { get } from "svelte/store";
    import { goto } from "$app/navigation";
    import { base } from "$app/paths";

    export let isCompetitiveMode = false;

    function showCompetitiveModeModal() {
        const activeMode = get(gameModeStore).activeMode;

        const goToTrainingOnClick = () => {
            modalStore.closeModal();
            if (activeMode === "virtual-player") {
                userActionService.setGameModePreset("beginner");
                uiStateStore.update((s) => ({ ...s, settingsMode: "default" }));
            } else {
                gameModeService.initializeGameMode("training");
                goto(`${base}/game/training`);
            }
        };

        logService.action(
            "Click: on a locked setting in competitive mode (SettingsGameplay)",
        );
        modalStore.showModal({
            titleKey: "modal.competitiveModeLockTitle",
            dataTestId: "competitive-mode-modal",
            contentKey: "modal.competitiveModeLockContent",
            buttons: [
                {
                    textKey: "modal.goToTraining",
                    primary: true,
                    onClick: goToTrainingOnClick,
                },
                { textKey: "modal.stay", onClick: modalStore.closeModal },
            ],
            closeOnOverlayClick: true,
        });
    }

    function selectBlockCount(count: number) {
        logService.action(
            `Click: "Вибір кількості блоків: ${count}" (SettingsGameplay)`,
        );
        if (count > 0 && get(gameSettingsStore).showDifficultyWarningModal) {
            modalStore.showModal({
                titleKey: "modal.expertModeTitle",
                dataTestId: "expert-mode-modal",
                contentKey: "modal.expertModeContent",
                buttons: [
                    {
                        textKey: "modal.expertModeConfirm",
                        primary: true,
                        isHot: true,
                        onClick: () => {
                            gameSettingsStore.updateSettings({
                                blockOnVisitCount: count,
                            });
                            modalStore.closeModal();
                        },
                    },
                    {
                        textKey: "modal.expertModeCancel",
                        onClick: modalStore.closeModal,
                    },
                ],
                closeOnOverlayClick: true,
                props: {
                    showDontShowAgain: true,
                    dontShowAgainBinding: () =>
                        gameSettingsStore.updateSettings({
                            showDifficultyWarningModal: false,
                        }),
                },
            });
        } else {
            gameSettingsStore.updateSettings({ blockOnVisitCount: count });
        }
    }

    function handleToggleAutoHideBoard(event: Event) {
        logService.action(
            'Click: "Автоматично приховувати дошку" (SettingsGameplay)',
        );
        gameSettingsStore.toggleAutoHideBoard();
    }
</script>

<div
    class:locked-setting={isCompetitiveMode}
    on:click|preventDefault|stopPropagation={isCompetitiveMode
        ? showCompetitiveModeModal
        : () => {}}
    on:keydown={(e) =>
        (e.key === "Enter" || e.key === " ") &&
        (isCompetitiveMode ? showCompetitiveModeModal() : () => {})}
    role="button"
    tabindex={isCompetitiveMode ? 0 : -1}
>
    <ToggleButton
        label={$_("gameModes.autoHideBoard")}
        checked={$gameSettingsStore.autoHideBoard}
        on:toggle={isCompetitiveMode ? () => {} : handleToggleAutoHideBoard}
        dataTestId="auto-hide-board-toggle"
    />
</div>
<div
    class:locked-setting={isCompetitiveMode}
    on:click|preventDefault|stopPropagation={isCompetitiveMode
        ? showCompetitiveModeModal
        : () => {}}
    on:keydown={(e) =>
        (e.key === "Enter" || e.key === " ") &&
        (isCompetitiveMode ? showCompetitiveModeModal() : () => {})}
    role="button"
    tabindex={isCompetitiveMode ? 0 : -1}
>
    <ToggleButton
        label={$_("gameControls.blockMode")}
        checked={$gameSettingsStore.blockModeEnabled}
        on:toggle={isCompetitiveMode
            ? () => {}
            : gameSettingsStore.toggleBlockMode}
        dataTestId="block-mode-toggle"
    />
</div>
{#if $gameSettingsStore.blockModeEnabled}
    <div class="settings-expander__options-group">
        <span class="settings-expander__label"
            >{$_("gameControls.blockAfter")}</span
        >
        <!-- FIX: Видалено use:fitTextAction -->
        <ButtonGroup
            variant="square"
            options={[0, 1, 2, 3].map((count) => ({
                label: (count + 1).toString(),
                active: $gameSettingsStore.blockOnVisitCount === count,
                dataTestId: `settings-expander-block-count-btn-${count}`,
                onClick: () => selectBlockCount(count),
            }))}
        />
    </div>
{/if}
