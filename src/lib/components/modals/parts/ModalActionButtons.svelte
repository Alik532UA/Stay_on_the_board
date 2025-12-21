<script lang="ts">
    import { _ } from "svelte-i18n";
    import { i18nReady } from "$lib/i18n/init.js";
    import { gameEventBus } from "$lib/services/gameEventBus";
    import { logService } from "$lib/services/logService";
    import StyledButton from "$lib/components/ui/StyledButton.svelte";
    import DontShowAgainCheckbox from "../../DontShowAgainCheckbox.svelte";
    import type { ModalState } from "$lib/stores/modalStore";
    import { focusManager } from "$lib/stores/focusManager.js";
    import { tick } from "svelte";

    export let modalState: ModalState;
    export let currentModalContext: string | null;
    export let isComputerMoveInProgress: boolean = false;
    export let buttonRefs: (HTMLButtonElement | null)[] = [];

    let processingButtons: boolean[] = [];

    $: if (modalState.buttons) {
        processingButtons = Array(modalState.buttons.length).fill(false);
    }

    // Auto-focus logic handled here or in parent?
    // In parent is easier for now, but we can emit event or just expose refs.
    // The logic `focusManager.focusWithDelay(buttonRefs[hotButtonIndex], 50);` was in parent.
</script>

<div class="modal-action-buttons">
    {#each modalState.buttons as btn, i (i)}
        <StyledButton
            variant={btn.customClass === "blue-btn"
                ? "info"
                : btn.customClass === "green-btn"
                  ? "primary"
                  : btn.customClass === "danger-btn"
                    ? "danger"
                    : btn.primary
                      ? "primary"
                      : "default"}
            bind:buttonElement={buttonRefs[i]}
            dataTestId={btn.dataTestId ||
                `${modalState.dataTestId}-${btn.textKey || btn.text}-btn`}
            disabled={btn.disabled ||
                isComputerMoveInProgress ||
                processingButtons[i]}
            on:click={async () => {
                if (processingButtons[i] || isComputerMoveInProgress) return;
                processingButtons[i] = true;
                logService.action(
                    `Click: "${btn.textKey ? $_(btn.textKey) : btn.text}" (Modal)`,
                );
                if (btn.onClick) await btn.onClick();
                else gameEventBus.dispatch("CloseModal");
            }}
        >
            {$i18nReady && btn.textKey ? $_(btn.textKey) : btn.text}
        </StyledButton>
    {/each}

    {#if modalState.titleKey === "gameModes.title"}
        <DontShowAgainCheckbox
            modalType="gameMode"
            tid={`${modalState.dataTestId}-dont-show-again-switch`}
            scope={currentModalContext}
        />
    {:else if modalState.titleKey === "modal.expertModeTitle"}
        <DontShowAgainCheckbox
            modalType="expertMode"
            tid={`${modalState.dataTestId}-dont-show-again-switch`}
            scope={currentModalContext}
        />
    {/if}

    <slot />
</div>
