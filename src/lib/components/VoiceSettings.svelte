<script lang="ts">
  import { gameSettingsStore } from "$lib/stores/gameSettingsStore.js";
  import { uiStateStore } from "$lib/stores/uiStateStore.js";
  import { _ } from "svelte-i18n";
  import ToggleButton from "./ToggleButton.svelte";
  import ButtonGroup from "$lib/components/ui/ButtonGroup.svelte";
  import StyledButton from "$lib/components/ui/StyledButton.svelte";
  import { speakTestPhrase } from "$lib/services/speechService";
  import { logService } from "$lib/services/logService.js";

  // Визначаємо, чи ми в онлайн режимі
  $: isOnlineMode = $uiStateStore.intendedGameType === "online";

  // Опції для швидкості
  $: speedOptions = [1, 1.2, 1.4, 1.6, 1.8, 2].map((rate) => ({
    label: `x${rate}`,
    active: $gameSettingsStore.speechRate === rate,
    onClick: () => {
      logService.ui(`Speech rate changed to ${rate}`);
      gameSettingsStore.updateSettings({ speechRate: rate });
      speakTestPhrase();
    },
    dataTestId: `speech-rate-${rate}-btn`,
  }));

  // Опції для порядку озвучення
  $: orderOptions = [
    {
      label: $_("voiceSettings.dist_dir"),
      active: $gameSettingsStore.speechOrder === "dist_dir",
      onClick: () => {
        logService.ui("Speech order changed to dist_dir");
        gameSettingsStore.updateSettings({ speechOrder: "dist_dir" });
      },
      dataTestId: "speech-order-dist-dir-btn",
    },
    {
      label: $_("voiceSettings.dir_dist"),
      active: $gameSettingsStore.speechOrder === "dir_dist",
      onClick: () => {
        logService.ui("Speech order changed to dir_dist");
        gameSettingsStore.updateSettings({ speechOrder: "dir_dist" });
      },
      dataTestId: "speech-order-dir-dist-btn",
    },
  ];

  // Опції для "Озвучувати для"
  $: speakForOptions = isOnlineMode
    ? [
        {
          label: $_("voiceSettings.myMove"),
          active: $gameSettingsStore.speechFor.onlineMyMove,
          onClick: () => {
            logService.ui("Speak for MY move toggled");
            gameSettingsStore.updateSettings({
              speechFor: {
                ...$gameSettingsStore.speechFor,
                onlineMyMove: !$gameSettingsStore.speechFor.onlineMyMove,
              },
            });
          },
          dataTestId: "speech-for-my-move-btn",
        },
        {
          label: $_("voiceSettings.opponentMove"),
          active: $gameSettingsStore.speechFor.onlineOpponentMove,
          onClick: () => {
            logService.ui("Speak for OPPONENT move toggled");
            gameSettingsStore.updateSettings({
              speechFor: {
                ...$gameSettingsStore.speechFor,
                onlineOpponentMove:
                  !$gameSettingsStore.speechFor.onlineOpponentMove,
              },
            });
          },
          dataTestId: "speech-for-opponent-move-btn",
        },
      ]
    : [
        {
          label: $_("voiceSettings.player"),
          active: $gameSettingsStore.speechFor.player,
          onClick: () => {
            logService.ui("Speak for player toggled");
            gameSettingsStore.updateSettings({
              speechFor: {
                ...$gameSettingsStore.speechFor,
                player: !$gameSettingsStore.speechFor.player,
              },
            });
          },
          dataTestId: "speech-for-player-btn",
        },
        {
          label: $_("voiceSettings.computer"),
          active: $gameSettingsStore.speechFor.computer,
          onClick: () => {
            logService.ui("Speak for computer toggled");
            gameSettingsStore.updateSettings({
              speechFor: {
                ...$gameSettingsStore.speechFor,
                computer: !$gameSettingsStore.speechFor.computer,
              },
            });
          },
          dataTestId: "speech-for-computer-btn",
        },
      ];
</script>

<div class="settings-section">
  <StyledButton
    variant="menu"
    on:click={() => speakTestPhrase()}
    dataTestId="voice-settings-test-voice-btn"
    style="width: 100%;"
  >
    {$_("voiceSettings.testVoice")}
  </StyledButton>
</div>

<div class="settings-section">
  <span class="settings-label">{$_("voiceSettings.speed")}</span>
  <!-- FIX: Додано dataTestId для контейнера -->
  <ButtonGroup options={speedOptions} dataTestId="voice-settings-speed-group" />
</div>

<div class="settings-section">
  <span class="settings-label">{$_("voiceSettings.order")}</span>
  <!-- FIX: Додано dataTestId для контейнера -->
  <ButtonGroup options={orderOptions} dataTestId="voice-settings-order-group" />
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
  <!-- FIX: Додано dataTestId для контейнера -->
  <ButtonGroup
    options={speakForOptions}
    dataTestId="voice-settings-speak-for-group"
  />
</div>

<style>
  .settings-section {
    margin-bottom: 24px;
  }

  .settings-label {
    display: block;
    font-weight: 700;
    margin-bottom: 10px;
    color: var(--text-secondary);
    font-size: 0.95em;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
</style>
