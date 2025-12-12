<script lang="ts">
  import FloatingBackButton from "$lib/components/FloatingBackButton.svelte";
  import RoomList from "$lib/components/online/RoomList.svelte";
  import CreateRoomModal from "$lib/components/online/CreateRoomModal.svelte";
  import StyledButton from "$lib/components/ui/StyledButton.svelte";
  import EditableText from "$lib/components/ui/EditableText.svelte";
  import { modalStore } from "$lib/stores/modalStore";
  import { _ } from "svelte-i18n";
  import { onMount } from "svelte";
  import { logService } from "$lib/services/logService";
  import { generateRandomPlayerName } from "$lib/utils/nameGenerator"; // ВИПРАВЛЕНО

  let playerName = "";

  onMount(() => {
    const storedName = localStorage.getItem("online_playerName");
    if (storedName) {
      playerName = storedName;
    } else {
      // Використовуємо генератор імен гравців
      playerName = generateRandomPlayerName(); // ВИПРАВЛЕНО
      localStorage.setItem("online_playerName", playerName);
    }
  });

  function handleNameChange(e: CustomEvent<string>) {
    playerName = e.detail;
    if (playerName) {
      localStorage.setItem("online_playerName", playerName);
      logService.ui(`[OnlinePage] Player name updated to: ${playerName}`);
    }
  }

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
    <div class="player-setup">
      <span class="label">{$_("onlineMenu.enterNameTitle")}</span>

      <div class="name-editor-wrapper">
        <EditableText
          value={playerName}
          canEdit={true}
          onRandom={generateRandomPlayerName}
          on:change={handleNameChange}
          placeholder={$_("onlineMenu.enterNamePlaceholder")}
          dataTestId="player-name-input"
        />
      </div>
    </div>

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

  .player-setup {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
  }

  .label {
    color: var(--text-secondary);
    font-size: 0.9em;
    font-weight: bold;
  }

  .name-editor-wrapper {
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 8px 16px;
    min-width: 200px;
    display: flex;
    justify-content: center;
  }

  .actions-bar {
    display: flex;
    justify-content: center;
  }
</style>
