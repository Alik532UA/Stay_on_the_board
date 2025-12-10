<script lang="ts">
  import FloatingBackButton from "$lib/components/FloatingBackButton.svelte";
  import RoomList from "$lib/components/online/RoomList.svelte";
  import CreateRoomModal from "$lib/components/online/CreateRoomModal.svelte";
  import StyledButton from "$lib/components/ui/StyledButton.svelte";
  import { modalStore } from "$lib/stores/modalStore";
  import { _ } from "svelte-i18n";
  import { onMount } from "svelte";

  // Перевірка імені гравця при вході
  onMount(() => {
    const name = localStorage.getItem("online_playerName");
    if (!name) {
      // Тут можна було б показати модалку для вводу імені
      // Поки що генеруємо автоматично для спрощення
      const newName = `Player ${Math.floor(Math.random() * 10000)}`;
      localStorage.setItem("online_playerName", newName);
    }
  });

  function openCreateRoomModal() {
    modalStore.showModal({
      titleKey: "onlineMenu.createRoomTitle",
      component: CreateRoomModal,
      dataTestId: "create-room-modal",
    });
  }
</script>

<div class="online-page">
  <div class="header-container">
    <FloatingBackButton />
    <h1>{$_("onlineMenu.title")}</h1>
  </div>

  <div class="content-container">
    <div class="actions-bar">
      <StyledButton
        variant="primary"
        size="large"
        on:click={openCreateRoomModal}
        dataTestId="create-room-btn"
      >
        {$_("onlineMenu.createRoom")}
      </StyledButton>
    </div>

    <RoomList />
  </div>
</div>

<style>
  .online-page {
    width: 100%;
    max-width: 1000px;
    margin: 0 auto;
    padding: 1rem;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .header-container {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 2rem;
  }

  h1 {
    text-align: center;
    color: var(--text-primary);
    margin: 0;
    font-size: 2em;
  }

  .content-container {
    display: flex;
    flex-direction: column;
    gap: 24px;
    flex: 1;
  }

  .actions-bar {
    display: flex;
    justify-content: center;
  }
</style>
