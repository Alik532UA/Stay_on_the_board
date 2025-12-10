<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { roomService } from "$lib/services/roomService";
    import type { Room, OnlinePlayer } from "$lib/types/online";
    import { _ } from "svelte-i18n";
    import StyledButton from "$lib/components/ui/StyledButton.svelte";
    import FloatingBackButton from "$lib/components/FloatingBackButton.svelte";
    import LobbyChat from "./LobbyChat.svelte";
    import { goto } from "$app/navigation";
    import { base } from "$app/paths";
    import type { Unsubscribe } from "firebase/firestore";
    import ToggleButton from "$lib/components/ToggleButton.svelte";
    import type { GameSettingsState } from "$lib/stores/gameSettingsStore";
    import ColorPicker from "$lib/components/local-setup/ColorPicker.svelte"; // Імпортуємо ColorPicker

    export let roomId: string;

    let room: Room | null = null;
    let myPlayerId: string | null = null;
    let unsubscribe: Unsubscribe | null = null;
    let isCopied = false;

    onMount(() => {
        const session = roomService.getSession();
        myPlayerId = session.playerId;

        if (!myPlayerId) {
            goto(`${base}/online`);
            return;
        }

        unsubscribe = roomService.subscribeToRoom(roomId, (updatedRoom) => {
            room = updatedRoom;
            if (room.status === "playing") {
                goto(`${base}/game/online`);
            }
        });
    });

    onDestroy(() => {
        if (unsubscribe) unsubscribe();
    });

    async function toggleReady() {
        if (!room || !myPlayerId) return;
        const me = room.players[myPlayerId];
        await roomService.toggleReady(roomId, myPlayerId, !me.isReady);
    }

    async function handleStartGame() {
        if (!room) return;
        await roomService.startGame(roomId);
    }

    async function handleLeave() {
        if (!myPlayerId) return;
        await roomService.leaveRoom(roomId, myPlayerId);
        goto(`${base}/online`);
    }

    function copyRoomId() {
        navigator.clipboard.writeText(roomId);
        isCopied = true;
        setTimeout(() => (isCopied = false), 2000);
    }

    // --- Функції оновлення гравця ---
    function handleUpdatePlayer(data: Partial<OnlinePlayer>) {
        if (!room || !myPlayerId) return;
        roomService.updatePlayer(roomId, myPlayerId, data);

        // Якщо змінили ім'я, зберігаємо його локально для майбутніх ігор
        if (data.name) {
            localStorage.setItem("online_playerName", data.name);
        }
    }

    // --- Функції налаштувань ---

    function updateBoardSize(increment: number) {
        if (!room || !canEditSettings) return;
        const newSize = room.settings.boardSize + increment;
        setBoardSize(newSize);
    }

    function setBoardSize(size: number) {
        if (!room || !canEditSettings) return;
        if (size >= 3 && size <= 9) {
            roomService.updateRoomSettings(roomId, { boardSize: size });
        }
    }

    function updateTurnDuration(increment: number) {
        if (!room || !canEditSettings) return;
        const currentDuration = room.settings.turnDuration || 30;
        const newDuration = currentDuration + increment;
        setTurnDuration(newDuration);
    }

    function setTurnDuration(duration: number) {
        if (!room || !canEditSettings) return;
        const newDuration = Math.max(5, Math.min(1000, duration));
        roomService.updateRoomSettings(roomId, { turnDuration: newDuration });
    }

    function toggleSetting(key: keyof GameSettingsState) {
        if (!room || !canEditSettings) return;
        // @ts-ignore
        const newValue = !room.settings[key];
        roomService.updateRoomSettings(roomId, { [key]: newValue });
    }

    function toggleGuestAccess() {
        if (!room || !amIHost) return;
        roomService.updateRoomSettings(roomId, {
            allowGuestSettings: !room.allowGuestSettings,
        });
    }

    function toggleSettingsLock() {
        if (!room || !canEditSettings) return;
        roomService.updateRoomSettings(roomId, {
            settingsLocked: !room.settings.settingsLocked,
        });
    }

    // --- Action для скраббінгу ---
    function scrubbable(
        node: HTMLElement,
        params: {
            value: number;
            min: number;
            max: number;
            step: number;
            onUpdate: (val: number) => void;
            disabled: boolean;
        },
    ) {
        let { value, min, max, step, onUpdate, disabled } = params;
        let startX = 0;
        let startValue = 0;

        function onMouseDown(e: MouseEvent) {
            if (disabled) return;
            e.preventDefault();
            startX = e.clientX;
            startValue = value;

            window.addEventListener("mousemove", onMouseMove);
            window.addEventListener("mouseup", onMouseUp);
            document.body.style.cursor = "ew-resize";
            node.classList.add("scrubbing");
        }

        function onMouseMove(e: MouseEvent) {
            const deltaX = e.clientX - startX;
            const deltaValue = Math.round(deltaX / step);
            let newValue = startValue + deltaValue;
            newValue = Math.max(min, Math.min(max, newValue));
            if (newValue !== value) {
                onUpdate(newValue);
            }
        }

        function onMouseUp() {
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
            document.body.style.cursor = "";
            node.classList.remove("scrubbing");
        }

        node.addEventListener("mousedown", onMouseDown);

        return {
            update(newParams: any) {
                value = newParams.value;
                min = newParams.min;
                max = newParams.max;
                step = newParams.step;
                onUpdate = newParams.onUpdate;
                disabled = newParams.disabled;
            },
            destroy() {
                node.removeEventListener("mousedown", onMouseDown);
            },
        };
    }

    // FIX: Сортування гравців за часом приєднання (стабільний список)
    $: playersList = room
        ? Object.values(room.players).sort((a, b) => a.joinedAt - b.joinedAt)
        : [];

    $: amIHost = room && myPlayerId ? room.hostId === myPlayerId : false;
    $: canEditSettings = amIHost || (room && room.allowGuestSettings);
    $: allReady =
        playersList.length >= 2 && playersList.every((p) => p.isReady);
    $: myName = room && myPlayerId ? room.players[myPlayerId]?.name : "Player";
</script>

<div class="lobby-container" data-testid="lobby-container">
    <FloatingBackButton on:click={handleLeave} />

    {#if room}
        <div class="lobby-grid">
            <!-- Ліва колонка: Інфо та Гравці -->
            <div class="left-column">
                <div class="lobby-header">
                    <h1 data-testid="room-name">{room.name}</h1>
                    <div class="room-id-container">
                        <span class="room-id" data-testid="room-id-display"
                            >ID: {roomId}</span
                        >
                        <button
                            class="copy-btn"
                            on:click={copyRoomId}
                            data-testid="copy-room-id-btn"
                        >
                            {isCopied
                                ? $_("onlineMenu.lobby.linkCopied")
                                : $_("onlineMenu.lobby.copyLink")}
                        </button>
                    </div>
                    <div
                        class="status-badge {room.status}"
                        data-testid="room-status-badge"
                    >
                        {$_(`onlineMenu.${room.status}`)}
                    </div>
                </div>

                <div class="players-section">
                    <h3>{$_("onlineMenu.players")} ({playersList.length}/8)</h3>
                    <div class="players-list" data-testid="players-list">
                        {#each playersList as player (player.id)}
                            <div
                                class="player-card"
                                class:is-me={player.id === myPlayerId}
                                data-testid={`player-card-${player.id}`}
                            >
                                <!-- FIX: ColorPicker для себе, аватар для інших -->
                                {#if player.id === myPlayerId}
                                    <div class="color-picker-wrapper">
                                        <ColorPicker
                                            value={player.color}
                                            on:change={(e) =>
                                                handleUpdatePlayer({
                                                    color: e.detail.value,
                                                })}
                                        />
                                    </div>
                                {:else}
                                    <div
                                        class="player-avatar"
                                        style="background-color: {player.color}"
                                    >
                                        {player.name[0].toUpperCase()}
                                    </div>
                                {/if}

                                <div class="player-info">
                                    <div class="player-name-row">
                                        <!-- FIX: Input для редагування імені -->
                                        {#if player.id === myPlayerId}
                                            <input
                                                type="text"
                                                class="player-name-input"
                                                value={player.name}
                                                on:change={(e) =>
                                                    handleUpdatePlayer({
                                                        name: e.currentTarget
                                                            .value,
                                                    })}
                                                maxlength="15"
                                            />
                                        {:else}
                                            <span class="player-name-text"
                                                >{player.name}</span
                                            >
                                        {/if}

                                        {#if player.id === room.hostId}
                                            <span
                                                class="host-badge"
                                                data-testid="host-badge"
                                                >{$_(
                                                    "onlineMenu.lobby.host",
                                                )}</span
                                            >
                                        {/if}
                                    </div>
                                    <div
                                        class="player-status"
                                        class:ready={player.isReady}
                                        data-testid={`player-status-${player.id}`}
                                    >
                                        {player.isReady
                                            ? $_("onlineMenu.lobby.ready")
                                            : $_("onlineMenu.lobby.notReady")}
                                    </div>
                                </div>
                            </div>
                        {/each}

                        <!-- Показуємо плейсхолдери, якщо гравців менше 2 -->
                        {#if playersList.length < 2}
                            <div class="player-card empty">
                                <div class="player-avatar placeholder">?</div>
                                <div class="player-info">
                                    {$_("onlineMenu.lobby.waitingForPlayers")}
                                </div>
                            </div>
                        {/if}
                    </div>
                </div>

                <div class="lobby-actions">
                    <StyledButton
                        variant={room.players[myPlayerId || ""]?.isReady
                            ? "default"
                            : "primary"}
                        on:click={toggleReady}
                        dataTestId="toggle-ready-btn"
                    >
                        {room.players[myPlayerId || ""]?.isReady
                            ? $_("onlineMenu.lobby.notReady")
                            : $_("onlineMenu.lobby.ready")}
                    </StyledButton>

                    {#if amIHost}
                        <StyledButton
                            variant="primary"
                            disabled={!allReady}
                            on:click={handleStartGame}
                            dataTestId="start-game-btn"
                        >
                            {$_("onlineMenu.lobby.startGame")}
                        </StyledButton>
                    {/if}
                </div>
            </div>

            <!-- Права колонка: Налаштування -->
            <div class="right-column">
                <div class="settings-section">
                    <h3>{$_("settings.title")}</h3>

                    <!-- Розмір дошки -->
                    <div class="setting-item">
                        <span>{$_("settings.boardSize")}</span>
                        <div class="size-controls">
                            <button
                                disabled={!canEditSettings ||
                                    room.settings.boardSize <= 3}
                                on:click={() => updateBoardSize(-1)}
                                data-testid="board-size-decrease-btn">-</button
                            >

                            <span
                                class="size-value scrubbable-value"
                                class:disabled={!canEditSettings}
                                use:scrubbable={{
                                    value: room.settings.boardSize,
                                    min: 3,
                                    max: 9,
                                    step: 20,
                                    onUpdate: setBoardSize,
                                    disabled: !canEditSettings,
                                }}
                                title={canEditSettings
                                    ? "Натисніть і потягніть для зміни"
                                    : ""}
                                data-testid="board-size-value"
                            >
                                {room.settings.boardSize}x{room.settings
                                    .boardSize}
                            </span>

                            <button
                                disabled={!canEditSettings ||
                                    room.settings.boardSize >= 9}
                                on:click={() => updateBoardSize(1)}
                                data-testid="board-size-increase-btn">+</button
                            >
                        </div>
                    </div>

                    <!-- Таймер -->
                    <div class="setting-item">
                        <span>Час на хід (сек)</span>
                        <div class="size-controls">
                            <button
                                disabled={!canEditSettings}
                                on:click={() => updateTurnDuration(-5)}
                                data-testid="turn-duration-decrease-btn"
                                >-</button
                            >

                            <span
                                class="size-value scrubbable-value"
                                class:disabled={!canEditSettings}
                                use:scrubbable={{
                                    value: room.settings.turnDuration || 30,
                                    min: 5,
                                    max: 1000,
                                    step: 2,
                                    onUpdate: setTurnDuration,
                                    disabled: !canEditSettings,
                                }}
                                title={canEditSettings
                                    ? "Натисніть і потягніть для зміни"
                                    : ""}
                                data-testid="turn-duration-value"
                            >
                                {room.settings.turnDuration || 30}
                            </span>

                            <button
                                disabled={!canEditSettings}
                                on:click={() => updateTurnDuration(5)}
                                data-testid="turn-duration-increase-btn"
                                >+</button
                            >
                        </div>
                    </div>

                    <!-- Автоматично приховувати дошку -->
                    <div class="setting-item full-width">
                        <ToggleButton
                            label={$_("gameModes.autoHideBoard")}
                            checked={room.settings.autoHideBoard}
                            disabled={!canEditSettings}
                            on:toggle={() => toggleSetting("autoHideBoard")}
                            dataTestId="auto-hide-board-toggle"
                        />
                    </div>

                    <!-- Режим блокування -->
                    <div class="setting-item full-width">
                        <ToggleButton
                            label={$_("gameControls.blockMode")}
                            checked={room.settings.blockModeEnabled}
                            disabled={!canEditSettings}
                            on:toggle={() => toggleSetting("blockModeEnabled")}
                            dataTestId="block-mode-toggle"
                        />
                    </div>

                    <!-- Заборонити зміни під час гри -->
                    <div class="setting-item full-width">
                        <ToggleButton
                            label={$_("localGame.lockSettings")}
                            checked={room.settings.settingsLocked}
                            disabled={!canEditSettings}
                            on:toggle={toggleSettingsLock}
                            dataTestId="lock-settings-toggle"
                        />
                    </div>

                    <!-- Дозволити гостям змінювати налаштування -->
                    {#if amIHost}
                        <div class="setting-item full-width">
                            <ToggleButton
                                label={$_(
                                    "onlineMenu.lobby.allowGuestSettings",
                                )}
                                checked={room.allowGuestSettings}
                                on:toggle={toggleGuestAccess}
                                dataTestId="allow-guest-settings-toggle"
                            />
                        </div>
                    {/if}

                    {#if !amIHost && !room.allowGuestSettings}
                        <div
                            class="host-only-hint"
                            data-testid="host-only-hint"
                        >
                            {$_("onlineMenu.lobby.hostOnlySettings")}
                        </div>
                    {/if}
                </div>

                <div class="chat-section">
                    <h3>Чат</h3>
                    <LobbyChat
                        {roomId}
                        playerId={myPlayerId || ""}
                        playerName={myName}
                    />
                </div>
            </div>
        </div>
    {:else}
        <div class="loading" data-testid="lobby-loading">
            {$_("common.loading")}
        </div>
    {/if}
</div>

<style>
    .lobby-container {
        max-width: 1000px;
        margin: 0 auto;
        padding: 20px;
        min-height: 100vh;
        color: var(--text-primary);
    }

    .lobby-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px;
        margin-top: 40px;
    }

    @media (max-width: 768px) {
        .lobby-grid {
            grid-template-columns: 1fr;
        }
    }

    .lobby-header,
    .players-section,
    .settings-section,
    .chat-section {
        background: var(--bg-secondary);
        padding: 20px;
        border-radius: var(--unified-border-radius);
        border: var(--unified-border);
        box-shadow: var(--unified-shadow);
        margin-bottom: 20px;
    }

    .lobby-header h1 {
        margin: 0 0 8px 0;
        font-size: 1.8em;
        text-align: center;
    }

    .room-id-container {
        display: flex;
        justify-content: center;
        gap: 10px;
        margin-bottom: 10px;
        color: var(--text-secondary);
        font-family: monospace;
    }

    .copy-btn {
        background: none;
        border: 1px solid var(--border-color);
        border-radius: 4px;
        cursor: pointer;
        color: var(--text-accent);
        font-size: 0.8em;
    }

    .status-badge {
        text-align: center;
        font-weight: bold;
        text-transform: uppercase;
        font-size: 0.9em;
        color: var(--text-accent);
    }

    .players-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .player-card {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        background: rgba(0, 0, 0, 0.1);
        border-radius: 12px;
        border: 1px solid transparent;
    }

    .player-card.is-me {
        border-color: var(--text-accent);
        background: rgba(var(--text-accent-rgb), 0.05);
    }

    .player-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        color: #fff;
    }

    .player-avatar.placeholder {
        background: var(--control-bg);
        color: var(--text-secondary);
    }

    .player-info {
        flex: 1;
        min-width: 0; /* Для коректного скорочення тексту */
    }

    .player-name-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 4px;
    }

    .player-name-text {
        font-weight: bold;
        font-size: 1.1em;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .player-name-input {
        background: rgba(0, 0, 0, 0.2);
        border: 1px solid var(--border-color);
        border-radius: 4px;
        padding: 2px 6px;
        color: var(--text-primary);
        font-weight: bold;
        font-size: 1.1em;
        width: 100%;
        max-width: 150px;
    }

    .host-badge {
        background: #ffd700;
        color: #000;
        font-size: 0.7em;
        padding: 2px 6px;
        border-radius: 4px;
        white-space: nowrap;
    }

    .player-status.ready {
        color: var(--positive-score-color);
        font-weight: bold;
    }

    .lobby-actions {
        display: flex;
        justify-content: center;
        gap: 16px;
        margin-top: 20px;
    }

    .setting-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
    }

    .setting-item.full-width {
        justify-content: center;
    }

    .size-controls {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .size-controls button {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        border: 1px solid var(--border-color);
        background: var(--control-bg);
        color: var(--text-primary);
        cursor: pointer;
    }

    .size-controls button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .size-value {
        font-weight: bold;
        min-width: 40px;
        text-align: center;
        user-select: none;
    }

    /* Стилі для інтерактивного значення */
    .scrubbable-value {
        cursor: ew-resize;
        padding: 2px 6px;
        border-radius: 4px;
        transition:
            background 0.2s,
            color 0.2s;
        border: 1px solid transparent;
    }

    .scrubbable-value:hover:not(.disabled) {
        background: rgba(255, 255, 255, 0.1);
        border-color: var(--border-color);
        color: var(--text-accent);
    }

    .scrubbable-value.disabled {
        cursor: default;
        opacity: 0.8;
    }

    /* Клас, що додається під час перетягування */
    :global(.scrubbable-value.scrubbing) {
        background: var(--control-selected);
        color: var(--control-selected-text);
        border-color: var(--control-selected);
    }

    .host-only-hint {
        font-size: 0.8em;
        color: var(--text-secondary);
        text-align: center;
        font-style: italic;
    }

    .loading {
        text-align: center;
        margin-top: 50px;
        font-size: 1.2em;
        color: var(--text-secondary);
    }
</style>
