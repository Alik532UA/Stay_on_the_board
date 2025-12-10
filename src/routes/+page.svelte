<script lang="ts">
  import MainMenu from "$lib/components/MainMenu.svelte";
  import DevClearCacheButton from "$lib/components/widgets/DevClearCacheButton.svelte";
  import FlexibleMenu from "$lib/components/ui/FlexibleMenu/FlexibleMenu.svelte";
  import type { IMenuItem } from "$lib/components/ui/FlexibleMenu/FlexibleMenu.types";
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { modalStore } from "$lib/stores/modalStore";
  import GameModeModal from "$lib/components/GameModeModal.svelte";
  import DevMenu from "$lib/components/main-menu/DevMenu.svelte";
  import { testModeStore, toggleTestMode } from "$lib/stores/testModeStore";
  import { clearCache } from "$lib/utils/cacheManager";
  import { appVersion } from "$lib/stores/versionStore";

  // Logic for bottom menu
  function handlePlayVirtualPlayer() {
    modalStore.showModal({
      titleKey: "mainMenu.gameModeModal.title",
      dataTestId: "game-mode-modal",
      component: GameModeModal,
      props: { extended: true },
      buttons: [
        {
          textKey: "modal.close",
          onClick: () => modalStore.closeModal(),
          dataTestId: "modal-btn-modal.close",
          hotKey: "ESC",
        },
      ],
    });
  }

  const menuItems: IMenuItem[] = [
    {
      id: "rewards",
      emoji: "🏆",
      onClick: () => goto(`${base}/rewards`),
    },
    {
      id: "donate",
      icon: "donate",
      dataTestId: "donate-btn",
      onClick: () => goto(`${base}/supporters`),
    },
    {
      id: "play",
      icon: "piece",
      onClick: handlePlayVirtualPlayer,
      primary: true,
    },
    {
      id: "settings",
      emoji: "⚙️",
      onClick: () => goto(`${base}/settings`),
    },
    {
      id: "rules",
      emoji: "📝",
      onClick: () => goto(`${base}/rules`),
    },
  ];

  // Logic for top (dev) menu
  let showDevMenuComponent: boolean = false;

  function openDevMenuModal() {
    modalStore.showModal({
      titleKey: "Dev Menu Modal",
      component: DevMenu,
      dataTestId: "dev-menu-modal",
      customClass: "dev-menu-modal-window",
      props: {
        onClose: () => modalStore.closeModal(),
        versionNumber: $appVersion,
      },
    });
  }

$: devMenuItems = [
    {
      id: "main-menu-link",
      emoji: "🏠",
      onClick: () => goto(`${base}/`),
    },
    {
      id: "dev-empty-1",
      emoji: "",
      onClick: () => {},
    },
    {
      id: "test-mode-btn",
      emoji: "🛠️",
      onClick: toggleTestMode,
      primary: true,
      isActive: $testModeStore.isEnabled,
    },
    {
      id: "dev-menu-modal",
      emoji: "☰",
      onClick: openDevMenuModal,
    },
    {
      id: "dev-clear-cache-btn",
      emoji: "🧹",
      onClick: () => clearCache({ keepAppearance: false }),
    },
  ];
</script>

<MainMenu />
<DevClearCacheButton />

{#if import.meta.env.DEV}
  <FlexibleMenu
    items={devMenuItems}
    position="top"
    persistenceKey="main-top-menu"
    dataTestId="flexible-menu-top-wrapper"
  />
{/if}

<!-- Demo of Flexible Menu -->
<FlexibleMenu
  items={menuItems}
  position="bottom"
  persistenceKey="main-bottom-menu"
  dataTestId="flexible-menu-bottom-wrapper"
/>
