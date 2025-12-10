<script lang="ts">
  import MainMenu from "$lib/components/MainMenu.svelte";
  import DevClearCacheButton from "$lib/components/widgets/DevClearCacheButton.svelte";
  import FlexibleMenu from "$lib/components/ui/FlexibleMenu/FlexibleMenu.svelte";
  import type { IMenuItem } from "$lib/components/ui/FlexibleMenu/FlexibleMenu.types";
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { modalStore } from "$lib/stores/modalStore";
  import GameModeModal from "$lib/components/GameModeModal.svelte";

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
      emoji: "🪙",
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
</script>

<MainMenu />
<DevClearCacheButton />

<!-- Demo of Flexible Menu -->
<FlexibleMenu
  items={menuItems}
  position="bottom"
  persistenceKey="main-bottom-menu"
/>
