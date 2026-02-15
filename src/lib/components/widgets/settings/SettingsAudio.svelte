<script lang="ts">
    import { gameSettingsStore } from "$lib/stores/gameSettingsStore";
    import { userActionService } from "$lib/services/userActionService";
    import { logService } from "$lib/services/logService";
    import { modalStore } from "$lib/stores/modalStore";
    import VoiceSettingsModal from "../../VoiceSettingsModal.svelte";
    import { t } from "$lib/i18n/typedI18n";
    import { blurOnClick } from "$lib/utils/actions";
    import { customTooltip } from "$lib/actions/customTooltip.js";
    import ToggleButton from "$lib/components/ToggleButton.svelte";
    import SvgIcons from "$lib/components/SvgIcons.svelte";

    $: speechEnabled = $gameSettingsStore.speechEnabled;

    function openVoiceSettings(e: MouseEvent) {
        logService.action('Click: "Voice Settings" (SettingsAudio)');
        e.stopPropagation();
        modalStore.showModal({
            component: VoiceSettingsModal,
            variant: "menu",
            dataTestId: "voice-settings-modal",
            closeOnOverlayClick: true,
        });
    }
</script>

<!-- FIX: Додано data-testid для контейнера -->
<div
    class="settings-expander__setting-item"
    data-testid="settings-audio-container"
>
    <ToggleButton
        label={$t("gameControls.speech")}
        checked={speechEnabled}
        on:toggle={() => userActionService.toggleSpeech()}
        dataTestId="speech-toggle"
    />
    <button
        data-testid="settings-expander-voice-settings-btn"
        class="settings-expander__square-btn"
        use:blurOnClick
        use:customTooltip={$t("gameControls.voiceSettingsTitle")}
        on:click|stopPropagation={openVoiceSettings}
    >
        <SvgIcons name="voice-settings" />
    </button>
</div>
