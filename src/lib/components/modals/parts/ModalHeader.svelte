<script lang="ts">
    import { _ } from "svelte-i18n";
    import { i18nReady } from "$lib/i18n/init.js";
    import { gameEventBus } from "$lib/services/gameEventBus";
    import { hotkeyTooltip } from "$lib/actions/hotkeyTooltip.js";
    import type { ModalState } from "$lib/stores/modalStore";

    export let modalState: ModalState;

    function close() {
        gameEventBus.dispatch("CloseModal");
    }
</script>

<div class="modal-header" data-testid={`${modalState.dataTestId}-header`}>
    <slot name="volume-control" />

    <div class="modal-title-wrapper">
        <h2
            class="modal-title"
            data-testid={`${modalState.dataTestId}-title`}
            data-i18n-key={modalState.titleKey}
        >
            {#if $i18nReady && modalState.titleKey}
                {$_(modalState.titleKey, {
                    values:
                        modalState.titleValues || (modalState.content as any),
                })}
            {:else}
                {modalState.title}
            {/if}
        </h2>
    </div>

    {#if modalState.closable}
        <button
            class="modal-close"
            use:hotkeyTooltip={{ key: "ESC" }}
            on:click={close}
            data-testid={`${modalState.dataTestId}-close-btn`}>×</button
        >
    {/if}
</div>
