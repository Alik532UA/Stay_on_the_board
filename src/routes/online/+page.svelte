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
  import { generateRandomPlayerName } from "$lib/utils/nameGenerator";

  let playerName = "";

  onMount(() => {
    const storedName = localStorage.getItem("online_playerName");
    if (storedName) {
      playerName = storedName;
    } else {
      playerName = generateRandomPlayerName();
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
    <div class="top-section">
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
          class="create-room-btn-glow"
        >
          <span class="btn-content">
            <span class="plus">+</span>
            {$_("onlineMenu.createRoom")}
          </span>
        </StyledButton>
      </div>
    </div>

    <RoomList />
  </div>
</div>

<style>
  .online-page {
    width: 100%;
    max-width: 1200px; /* Increased for wider grid */
    margin: 0 auto;
    padding: 1rem;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
  }

  .header-container {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 2rem;
    padding-top: 1rem;
  }

  h1 {
    text-align: center;
    color: var(--text-primary);
    margin: 0;
    font-size: 2.5rem;
    font-weight: 800;
    letter-spacing: -0.5px;
    text-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  }

  .content-container {
    display: flex;
    flex-direction: column;
    gap: 32px;
    flex: 1;
    width: 100%;
    box-sizing: border-box;
  }

  .top-section {
    display: flex;
    flex-direction: column;
    gap: 24px;
    padding-bottom: 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    margin-bottom: 8px;
  }

  .player-setup {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    width: 100%;
  }

  .label {
    color: var(--text-secondary);
    font-size: 0.9em;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .name-editor-wrapper {
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    border-radius: 16px;
    padding: 12px 24px;
    min-width: var(--responsive-min-width, 300px);
    max-width: 90%;
    display: flex;
    justify-content: center;
    box-sizing: border-box;
    transition:
      transform 0.2s,
      border-color 0.2s;
  }

  .name-editor-wrapper:hover {
    border-color: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
  }

  .actions-bar {
    display: flex;
    justify-content: center;
    width: 100%;
  }

  :global(.create-room-btn-glow) {
    box-shadow: 0 0 20px rgba(var(--primary-rgb, 33, 150, 243), 0.4);
    transition: all 0.3s ease;
  }

  :global(.create-room-btn-glow:hover) {
    box-shadow: 0 0 30px rgba(var(--primary-rgb, 33, 150, 243), 0.6);
    transform: scale(1.05);
  }

  .btn-content {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 700;
    font-size: 1.1rem;
  }

  .plus {
    font-size: 1.4rem;
    line-height: 1;
  }

  @media (min-width: 768px) {
    .top-section {
      flex-direction: row;
      justify-content: space-between;
      align-items: end;
      padding: 0 16px 24px 16px;
    }

    .player-setup {
      align-items: flex-start;
      width: auto;
    }

    .actions-bar {
      width: auto;
    }
  }
</style>
