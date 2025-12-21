<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import SvgIcons from "$lib/components/SvgIcons.svelte";
    import StyledButton from "$lib/components/ui/StyledButton.svelte";
    import { _ } from "svelte-i18n";
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
    <StyledButton
        variant="primary"
        size="large"
        disabled={confirmDisabled || disabled}
        on:click={() => dispatch("confirm")}
        tooltip={$_("gameControls.confirm")}
        dataTestId="confirm-move-btn"
        style="width: 90%;"
    >
        <span slot="icon"><SvgIcons name="confirm" /></span>
        {$_("gameControls.confirm")}
    </StyledButton>

    {#if blockModeEnabled}
        <StyledButton
            variant="warning"
            size="large"
            {disabled}
            on:click={() => dispatch("noMoves")}
            tooltip={$_("gameControls.noMovesTitle")}
            dataTestId="no-moves-btn"
            style="width: 90%;"
        >
            <span slot="icon"><SvgIcons name="no-moves" /></span>
            {$_("gameControls.noMovesTitle")}
        </StyledButton>
    {/if}

    {#if !isIos}
        <StyledButton
            variant="info"
            size="large"
            disabled={!isVoiceSupported || disabled}
            on:click={() => dispatch("voiceCommand")}
            tooltip={voiceButtonTooltip}
            dataTestId="voice-command-btn"
            class={$voiceControlStore.lastTranscript !== "" ? "active" : ""}
            style="width: 90%; {$voiceControlStore.lastTranscript !== ''
                ? voiceButtonStyle
                : ''}"
        >
            <span slot="icon"><SvgIcons name="microphone" /></span>
            {$_("gameControls.voiceCommand")}
        </StyledButton>
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
