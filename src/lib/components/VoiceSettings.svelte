<script>
  import { gameSettingsStore } from "$lib/stores/gameSettingsStore.js";
  import { uiStateStore } from "$lib/stores/uiStateStore.js";
  import { _ } from "svelte-i18n";
  import ToggleButton from "./ToggleButton.svelte";
  import { speakTestPhrase } from "$lib/services/speechService";
  import { logService } from "$lib/services/logService.js";

  // Визначаємо, чи ми в онлайн режимі
  $: isOnlineMode = $uiStateStore.intendedGameType === 'online';
</script>

<div class="settings-section">
  <button
    class="test-voice-button"
    onclick={() => speakTestPhrase()}
    data-testid="voice-settings-test-voice-btn"
  >
    {$_("voiceSettings.testVoice")}
  </button>
</div>

<div class="settings-section">
  <span class="settings-label">{$_("voiceSettings.speed")}</span>
  <div class="button-group">
    <button
      class:active={$gameSettingsStore.speechRate === 1}
      onclick={() => {
        logService.ui("Speech rate changed to 1");
        gameSettingsStore.updateSettings({ speechRate: 1 });
        speakTestPhrase();
      }}
      data-testid="speech-rate-1-btn">x1</button
    >
    <button
      class:active={$gameSettingsStore.speechRate === 1.2}
      onclick={() => {
        logService.ui("Speech rate changed to 1.2");
        gameSettingsStore.updateSettings({ speechRate: 1.2 });
        speakTestPhrase();
      }}
      data-testid="speech-rate-1.2-btn">x1.2</button
    >
    <button
      class:active={$gameSettingsStore.speechRate === 1.4}
      onclick={() => {
        logService.ui("Speech rate changed to 1.4");
        gameSettingsStore.updateSettings({ speechRate: 1.4 });
        speakTestPhrase();
      }}
      data-testid="speech-rate-1.4-btn">x1.4</button
    >
    <button
      class:active={$gameSettingsStore.speechRate === 1.6}
      onclick={() => {
        logService.ui("Speech rate changed to 1.6");
        gameSettingsStore.updateSettings({ speechRate: 1.6 });
        speakTestPhrase();
      }}
      data-testid="speech-rate-1.6-btn">x1.6</button
    >
    <button
      class:active={$gameSettingsStore.speechRate === 1.8}
      onclick={() => {
        logService.ui("Speech rate changed to 1.8");
        gameSettingsStore.updateSettings({ speechRate: 1.8 });
        speakTestPhrase();
      }}
      data-testid="speech-rate-1.8-btn">x1.8</button
    >
    <button
      class:active={$gameSettingsStore.speechRate === 2}
      onclick={() => {
        logService.ui("Speech rate changed to 2");
        gameSettingsStore.updateSettings({ speechRate: 2 });
        speakTestPhrase();
      }}
      data-testid="speech-rate-2-btn">x2</button
    >
  </div>
</div>
<div class="settings-section">
  <span class="settings-label">{$_("voiceSettings.order")}</span>
  <div class="button-group">
    <button
      class:active={$gameSettingsStore.speechOrder === "dist_dir"}
      onclick={() => {
        logService.ui("Speech order changed to dist_dir");
        gameSettingsStore.updateSettings({ speechOrder: "dist_dir" });
      }}
      data-testid="speech-order-dist-dir-btn"
      >{$_("voiceSettings.dist_dir")}</button
    >
    <button
      class:active={$gameSettingsStore.speechOrder === "dir_dist"}
      onclick={() => {
        logService.ui("Speech order changed to dir_dist");
        gameSettingsStore.updateSettings({ speechOrder: "dir_dist" });
      }}
      data-testid="speech-order-dir-dist-btn"
      >{$_("voiceSettings.dir_dist")}</button
    >
  </div>
</div>
<div class="settings-section">
  <ToggleButton
    label={$_("voiceSettings.shortSpeech")}
    checked={$gameSettingsStore.shortSpeech}
    on:toggle={() => {
      logService.ui("Short speech toggled");
      gameSettingsStore.updateSettings({
        shortSpeech: !$gameSettingsStore.shortSpeech,
      });
    }}
    dataTestId="short-speech-toggle-btn"
  />
</div>
<div class="settings-section">
  <ToggleButton
    label={$_("voiceSettings.speakModalTitles")}
    checked={$gameSettingsStore.speakModalTitles}
    on:toggle={() => {
      logService.ui("Speak modal titles toggled");
      gameSettingsStore.updateSettings({
        speakModalTitles: !$gameSettingsStore.speakModalTitles,
      });
    }}
    dataTestId="speak-modal-titles-toggle-btn"
  />
</div>
<div class="settings-section">
  <span class="settings-label">{$_("voiceSettings.speakFor")}</span>
  <div class="button-group">
    {#if isOnlineMode}
        <!-- Кнопки для Онлайн режиму -->
        <button
        class:active={$gameSettingsStore.speechFor.onlineMyMove}
        onclick={() => {
            logService.ui("Speak for MY move toggled");
            gameSettingsStore.updateSettings({
            speechFor: {
                ...$gameSettingsStore.speechFor,
                onlineMyMove: !$gameSettingsStore.speechFor.onlineMyMove,
            },
            });
        }}
        data-testid="speech-for-my-move-btn">{$_("voiceSettings.myMove")}</button
        >
        <button
        class:active={$gameSettingsStore.speechFor.onlineOpponentMove}
        onclick={() => {
            logService.ui("Speak for OPPONENT move toggled");
            gameSettingsStore.updateSettings({
            speechFor: {
                ...$gameSettingsStore.speechFor,
                onlineOpponentMove: !$gameSettingsStore.speechFor.onlineOpponentMove,
            },
            });
        }}
        data-testid="speech-for-opponent-move-btn"
        >{$_("voiceSettings.opponentMove")}</button
        >
    {:else}
        <!-- Кнопки для Локального/Тренувального режиму -->
        <button
        class:active={$gameSettingsStore.speechFor.player}
        onclick={() => {
            logService.ui("Speak for player toggled");
            gameSettingsStore.updateSettings({
            speechFor: {
                ...$gameSettingsStore.speechFor,
                player: !$gameSettingsStore.speechFor.player,
            },
            });
        }}
        data-testid="speech-for-player-btn">{$_("voiceSettings.player")}</button
        >
        <button
        class:active={$gameSettingsStore.speechFor.computer}
        onclick={() => {
            logService.ui("Speak for computer toggled");
            gameSettingsStore.updateSettings({
            speechFor: {
                ...$gameSettingsStore.speechFor,
                computer: !$gameSettingsStore.speechFor.computer,
            },
            });
        }}
        data-testid="speech-for-computer-btn"
        >{$_("voiceSettings.computer")}</button
        >
    {/if}
  </div>
</div>

<style>
  .settings-section {
    margin-bottom: 20px;
  }

  .settings-label {
    display: block;
    font-weight: bold;
    margin-bottom: 8px;
  }

  .button-group {
    display: flex;
    gap: 10px;
    width: 100%;
    flex-wrap: wrap;
  }

  .button-group button {
    background-color: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
    padding: 8px 16px;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.2s;
    flex-grow: 1;
    text-align: center;
  }

  .button-group button.active {
    background-color: var(--text-accent, #ffbe0b);
    color: #000;
    font-weight: bold;
  }

  .test-voice-button {
    background-color: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
    padding: 8px 16px;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.2s;
    width: 100%;
  }
</style>