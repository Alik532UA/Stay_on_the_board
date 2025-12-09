<script lang="ts">
    import { gameSettingsStore } from "$lib/stores/gameSettingsStore.js";
    import { userActionService } from "$lib/services/userActionService.js";
    import { logService } from "$lib/services/logService.js";
    import { openVoiceSettingsModal } from "$lib/stores/uiStore";
    import { _ } from "svelte-i18n";
    import { blurOnClick } from "$lib/utils/actions";
    import { customTooltip } from "$lib/actions/customTooltip.js";
    import ToggleButton from "$lib/components/ToggleButton.svelte";
    import SvgIcons from "$lib/components/SvgIcons.svelte";

    $: speechEnabled = $gameSettingsStore.speechEnabled;

    function openVoiceSettings(e: MouseEvent) {
        logService.action('Click: "Voice Settings" (SettingsAudio)');
        e.stopPropagation();
        openVoiceSettingsModal();
    }
</script>

<div class="settings-expander__setting-item">
    <ToggleButton
        label={$_("gameControls.speech")}
        checked={speechEnabled}
        on:toggle={() => userActionService.toggleSpeech()}
        dataTestId="speech-toggle"
    />
    <button
        data-testid="voice-settings-btn"
        class="settings-expander__square-btn"
        use:blurOnClick
        use:customTooltip={$_("gameControls.voiceSettingsTitle")}
        on:click|stopPropagation={openVoiceSettings}
    >
        <SvgIcons name="voice-settings" />
    </button>
</div>
