<script lang="ts">
  import { modalStore } from "$lib/stores/modalStore";
  import { logService } from "$lib/services/logService.js";
  import { APP_CONFIG } from "$lib/config/appConfig";

  // Sub-components
  import TopIconsBar from "$lib/components/main-menu/v2/TopIconsBar.svelte";
  import CenterPlayButton from "$lib/components/main-menu/v2/CenterPlayButton.svelte";
  import HamburgerMenu from "$lib/components/main-menu/v2/HamburgerMenu.svelte";

  // Modals
  import GameModeModal from "$lib/components/GameModeModal.svelte";
  import FeedbackModal from "$lib/components/modals/FeedbackModal.svelte";

  function handlePlay() {
    logService.action('Click: "Play" (MainMenuV2)');
    modalStore.showModal({
      // Заголовок видаляємо з UI компонента GameModeModal, але залишаємо тут для a11y або логів, якщо потрібно
      // titleKey: `mainMenu.modes.${APP_CONFIG.MODES.SURVIVE}`,
      dataTestId: "game-mode-modal",
      component: GameModeModal,
      props: { extended: true },
      variant: "menu",
      // FIX: Прибираємо кнопки (footer), щоб відповідати дизайну меню
      buttons: [],
      // FIX: Дозволяємо закриття кліком по фону
      closeOnOverlayClick: true,
    });
  }

  function handleFeedback() {
    logService.action('Click: "Feedback" (MainMenuV2)');
    modalStore.showModal({
      titleKey: "ui.feedback.title",
      dataTestId: "feedback-modal",
      component: FeedbackModal,
      buttons: [],
      closeOnOverlayClick: true,
    });
  }
</script>

<div class="main-menu-v2">
  <TopIconsBar onFeedback={handleFeedback} />

  <CenterPlayButton onPlay={handlePlay} />

  <HamburgerMenu onPlay={handlePlay} onFeedback={handleFeedback} />
</div>

<style>
  .main-menu-v2 {
    position: fixed;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: transparent;
  }
</style>
