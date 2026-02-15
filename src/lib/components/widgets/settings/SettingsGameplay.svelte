<script lang="ts">
    import { gameSettingsStore } from "$lib/stores/gameSettingsStore";
    import { gameModeStore } from "$lib/stores/gameModeStore";
    import { modalStore } from "$lib/stores/modalStore";
    import { userActionService } from "$lib/services/userActionService";
    import { gameModeService } from "$lib/services/gameModeService";
    import { uiStateStore } from "$lib/stores/uiStateStore";
    import { logService } from "$lib/services/logService";
    import { t } from "$lib/i18n/typedI18n";
    import ToggleButton from "$lib/components/ToggleButton.svelte";
    import ButtonGroup from "$lib/components/ui/ButtonGroup.svelte";
    import { get } from "svelte/store";
    import { goto } from "$app/navigation";
    import { base } from "$app/paths";
    import SimpleModalContent from "$lib/components/modals/SimpleModalContent.svelte";

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
            component: SimpleModalContent,
            variant: "menu",
            dataTestId: "competitive-mode-modal",
            props: {
                titleKey: "modal.competitiveModeLockTitle" as const,
                contentKey: "modal.competitiveModeLockContent" as const,
                actions: [
                    {
                        labelKey: "modal.goToTraining" as const,
                        variant: "primary",
                        isHot: true,
                        onClick: goToTrainingOnClick,
                        dataTestId: "go-to-training-btn",
                    },
                    {
                        labelKey: "modal.stay" as const,
                        onClick: () => modalStore.closeModal(),
                        dataTestId: "stay-in-competitive-btn",
                    },
                ],
            },
            closeOnOverlayClick: true,
        });
    }

    function selectBlockCount(count: number) {
        logService.action(
            `Click: "Вибір кількості блоків: ${count}" (SettingsGameplay)`,
        );
        if (count > 0 && get(gameSettingsStore).showDifficultyWarningModal) {
            modalStore.showModal({
                component: SimpleModalContent,
                variant: "menu",
                dataTestId: "expert-mode-modal",
                props: {
                    titleKey: "modal.expertModeTitle" as const,
                    contentKey: "modal.expertModeContent" as const,
                    showDontShowAgain: true,
                    dontShowAgainType: "expertMode",
                    actions: [
                        {
                            labelKey: "modal.expertModeConfirm" as const,
                            variant: "primary",
                            isHot: true,
                            onClick: () => {
                                gameSettingsStore.updateSettings({
                                    blockOnVisitCount: count,
                                });
                                modalStore.closeModal();
                            },
                            dataTestId: "expert-mode-confirm-btn",
                        },
                        {
                            labelKey: "modal.expertModeCancel" as const,
                            onClick: () => modalStore.closeModal(),
                            dataTestId: "expert-mode-cancel-btn",
                        },
                    ],
                },
                closeOnOverlayClick: true,
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
    data-testid="auto-hide-board-container"
>
    <ToggleButton
        label={$t("gameModes.autoHideBoard")}
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
    data-testid="block-mode-container"
>
    <ToggleButton
        label={$t("gameControls.blockMode")}
        checked={$gameSettingsStore.blockModeEnabled}
        on:toggle={isCompetitiveMode
            ? () => {}
            : gameSettingsStore.toggleBlockMode}
        dataTestId="block-mode-toggle"
    />
</div>
{#if $gameSettingsStore.blockModeEnabled}
    <div
        class="settings-expander__options-group"
        data-testid="block-count-options-container"
    >
        <span class="settings-expander__label"
            >{$t("gameControls.blockAfter")}</span
        >
        <!-- FIX: Додано dataTestId для контейнера групи -->
        <ButtonGroup
            dataTestId="settings-block-count-group"
            options={[0, 1, 2, 3].map((count) => ({
                label: (count + 1).toString(),
                active: $gameSettingsStore.blockOnVisitCount === count,
                dataTestId: `settings-expander-block-count-btn-${count}`,
                onClick: () => selectBlockCount(count),
            }))}
        />
    </div>
{/if}
