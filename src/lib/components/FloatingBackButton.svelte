<script lang="ts">
  import { navigationService } from "$lib/services/navigationService.js";
  import { _ } from "svelte-i18n";
  import { customTooltip } from "$lib/actions/customTooltip.js";
  import { logService } from "$lib/services/logService.js";

  // Додаємо опціональний проп для кастомної дії
  export let onClick: (() => void) | undefined = undefined;

  function handleClick() {
    if (onClick) {
      logService.ui("FloatingBackButton: Custom onClick executed");
      onClick();
    } else {
      logService.ui("FloatingBackButton: Default navigation executed");
      navigationService.goToMainMenu();
    }
  }
</script>

<button
  data-testid="floating-back-btn"
  class="floating-back-btn"
  aria-label={$_("ui.goBack") || "Повернутися назад"}
  use:customTooltip={$_("ui.goBack") || "Повернутися назад"}
  on:click={handleClick}
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2.5"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <line x1="19" y1="12" x2="5" y2="12"></line>
    <polyline points="12 19 5 12 12 5"></polyline>
  </svg>
</button>

<style>
  .floating-back-btn {
    position: fixed;
    top: 20px;
    left: 20px;
    width: 52px;
    height: 52px;
    border-radius: 50%;
    border: none;
    background: rgba(0, 0, 0, 0.2);
    color: white;
    cursor: pointer;
    z-index: 1010;
    display: flex;
    align-items: center;
    justify-content: center;
    transition:
      background-color 0.2s,
      transform 0.2s,
      box-shadow 0.2s;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  .floating-back-btn:hover {
    background: rgba(0, 0, 0, 0.4);
    transform: scale(1.05);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  }
  .floating-back-btn svg {
    width: 200%;
    height: 200%;
    flex-shrink: 0;
  }
</style>
