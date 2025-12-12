<script lang="ts">
  import FloatingBackButton from "$lib/components/FloatingBackButton.svelte";
  import RoomList from "$lib/components/online/RoomList.svelte";
  import CreateRoomModal from "$lib/components/online/CreateRoomModal.svelte";
  import StyledButton from "$lib/components/ui/StyledButton.svelte";
  import { modalStore } from "$lib/stores/modalStore";
  import { _ } from "svelte-i18n";
  import { onMount } from "svelte";
  import { logService } from "$lib/services/logService";

  let playerName = "";

  onMount(() => {
    const storedName = localStorage.getItem("online_playerName");
    if (storedName) {
      playerName = storedName;
    } else {
      playerName = `Player ${Math.floor(Math.random() * 10000)}`;
      localStorage.setItem("online_playerName", playerName);
    }
  });

  function handleNameChange(e: Event) {
    const input = e.target as HTMLInputElement;
    playerName = input.value.trim();
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
      <label for="player-name-input">{$_("onlineMenu.enterNameTitle")}</label>
      <input
        id="player-name-input"
        type="text"
        value={playerName}
        on:input={handleNameChange}
        placeholder={$_("onlineMenu.enterNamePlaceholder")}
        class="name-input"
        data-testid="player-name-input"
      />
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

  .player-setup label {
    color: var(--text-secondary);
    font-size: 0.9em;
    font-weight: bold;
  }

  .name-input {
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 12px 16px;
    color: var(--text-primary);
    font-size: 1.1em;
    text-align: center;
    width: 100%;
    max-width: 300px;
    transition: all 0.2s;
  }

  .name-input:focus {
    outline: none;
    border-color: var(--text-accent);
    box-shadow: 0 0 0 2px rgba(var(--text-accent-rgb), 0.2);
  }

  .actions-bar {
    display: flex;
    justify-content: center;
  }
</style>
