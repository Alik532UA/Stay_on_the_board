<script lang="ts">
    import { _ } from "svelte-i18n";
    import type { OnlinePlayer } from "$lib/types/online";
    import ColorPicker from "$lib/components/local-setup/ColorPicker.svelte";
    import StyledButton from "$lib/components/ui/StyledButton.svelte";

    export let players: OnlinePlayer[];
    export let myPlayerId: string;
    export let hostId: string;
    export let roomStatus: "waiting" | "playing" | "finished";
    export let onUpdatePlayer: (data: Partial<OnlinePlayer>) => void;
    export let onToggleReady: () => void;
    export let onStartGame: () => void;
    export let amIHost: boolean;

    $: allReady = players.length >= 2 && players.every((p) => p.isReady);
    $: myPlayer = players.find((p) => p.id === myPlayerId);

    function getPlayerStatus(player: OnlinePlayer) {
        if (player.isReady) {
            return { text: "onlineMenu.lobby.ready", class: "ready" };
        }
        if (player.isWatchingReplay) {
            return {
                text: "onlineMenu.lobby.watchingReplay",
                class: "watching",
            };
        }

        // Розділяємо логіку для 'playing' та 'finished'
        if (roomStatus === "playing") {
            return { text: "onlineMenu.playing", class: "playing" };
        }
        if (roomStatus === "finished") {
            return {
                text: "onlineMenu.lobby.viewingResults",
                class: "viewing-results",
            };
        }

        return { text: "onlineMenu.lobby.notReady", class: "" };
    }
</script>

<div class="players-section">
    <h3>{$_("onlineMenu.players")} ({players.length}/8)</h3>
    <div class="players-list" data-testid="players-list">
        {#each players as player (player.id)}
            {@const status = getPlayerStatus(player)}
            <div
                class="player-card"
                class:is-me={player.id === myPlayerId}
                data-testid={`player-card-${player.id}`}
            >
                {#if player.id === myPlayerId}
                    <div class="color-picker-wrapper">
                        <ColorPicker
                            value={player.color}
                            on:change={(e) =>
                                onUpdatePlayer({ color: e.detail.value })}
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
                        {#if player.id === myPlayerId}
                            <input
                                type="text"
                                class="player-name-input"
                                value={player.name}
                                on:change={(e) =>
                                    onUpdatePlayer({
                                        name: e.currentTarget.value,
                                    })}
                                maxlength="15"
                            />
                        {:else}
                            <span class="player-name-text">{player.name}</span>
                        {/if}

                        {#if player.id === hostId}
                            <span class="host-badge" data-testid="host-badge">
                                {$_("onlineMenu.lobby.host")}
                            </span>
                        {/if}
                    </div>
                    <div
                        class="player-status {status.class}"
                        data-testid={`player-status-${player.id}`}
                    >
                        {$_(status.text)}
                    </div>
                </div>
            </div>
        {/each}

        {#if players.length < 2}
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
        variant={myPlayer?.isReady ? "default" : "primary"}
        on:click={onToggleReady}
        dataTestId="toggle-ready-btn"
    >
        {myPlayer?.isReady
            ? $_("onlineMenu.lobby.notReady")
            : $_("onlineMenu.lobby.ready")}
    </StyledButton>

    {#if amIHost}
        <StyledButton
            variant="primary"
            disabled={!allReady}
            on:click={onStartGame}
            dataTestId="start-game-btn"
        >
            {$_("onlineMenu.lobby.startGame")}
        </StyledButton>
    {/if}
</div>

<style>
    .players-section {
        background: var(--bg-secondary);
        padding: 20px;
        border-radius: var(--unified-border-radius);
        border: var(--unified-border);
        box-shadow: var(--unified-shadow);
        margin-bottom: 20px;
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
        min-width: 0;
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
    .player-status.playing {
        color: var(--text-accent);
        font-style: italic;
    }
    .player-status.watching {
        color: #03a9f4; /* Light Blue */
        font-style: italic;
    }
    .player-status.viewing-results {
        color: #9c27b0; /* Purple */
        font-style: italic;
    }
    .lobby-actions {
        display: flex;
        justify-content: center;
        gap: 16px;
        margin-top: 20px;
    }
</style>
