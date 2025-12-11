<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import SvgIcons from "$lib/components/SvgIcons.svelte";
    import { _ } from "svelte-i18n";
    import { customTooltip } from "$lib/actions/customTooltip.js";
    import { voiceControlStore } from "$lib/stores/voiceControlStore";

    export let confirmDisabled: boolean = false;
    export let blockModeEnabled: boolean = false;
    export let isVoiceSupported: boolean = false;
    export let disabled: boolean = false;
    export let isIos: boolean = false;

    const dispatch = createEventDispatcher();

    $: voiceButtonStyle = `box-shadow: 0 0 0 ${$voiceControlStore.volume * 20}px rgba(229, 57, 53, ${Math.min($voiceControlStore.volume * 2, 1)});`;
    $: voiceButtonTooltip = isVoiceSupported
        ? $_("gameControls.voiceCommandTitle")
        : $_("gameControls.voiceCommandNotSupported");
</script>

<div class="action-btns">
    <button
        class="confirm-btn {confirmDisabled ? 'disabled' : ''}"
        on:click={() => !disabled && dispatch("confirm")}
        use:customTooltip={$_("gameControls.confirm")}
        data-testid="confirm-move-btn"
        {disabled}
    >
        <SvgIcons name="confirm" />
        {$_("gameControls.confirm")}
    </button>

    {#if blockModeEnabled}
        <button
            class="no-moves-btn"
            on:click={() => !disabled && dispatch("noMoves")}
            use:customTooltip={$_("gameControls.noMovesTitle")}
            data-testid="no-moves-btn"
            {disabled}
        >
            <SvgIcons name="no-moves" />
            {$_("gameControls.noMovesTitle")}
        </button>
    {/if}

    {#if !isIos}
        <button
            class="voice-btn"
            on:click={() => !disabled && dispatch("voiceCommand")}
            use:customTooltip={voiceButtonTooltip}
            data-testid="voice-command-btn"
            class:active={$voiceControlStore.lastTranscript !== ""}
            disabled={!isVoiceSupported || disabled}
            style={$voiceControlStore.lastTranscript !== ""
                ? voiceButtonStyle
                : ""}
        >
            <SvgIcons name="microphone" />
            {$_("gameControls.voiceCommand")}
        </button>
    {/if}
</div>

<style>
    .action-btns {
        display: flex;
        flex-direction: column;
        gap: 14px;
        width: 100%;
        align-items: center;
        margin-top: 18px;
    }
</style>
