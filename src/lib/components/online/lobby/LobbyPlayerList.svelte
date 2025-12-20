<script lang="ts">
    import { _ } from "svelte-i18n";
    import type { OnlinePlayer } from "$lib/types/online";
    import ColorPicker from "$lib/components/local-setup/ColorPicker.svelte";
    import StyledButton from "$lib/components/ui/StyledButton.svelte";
    import EditableText from "$lib/components/ui/EditableText.svelte";
    import { generateRandomPlayerName } from "$lib/utils/nameGenerator";
    import { flip } from "svelte/animate";
    import { fly, fade } from "svelte/transition";
    import SvgIcons from "$lib/components/SvgIcons.svelte";

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
            return {
                text: "onlineMenu.lobby.ready",
                class: "ready",
                icon: "confirm",
            };
        }
        if (player.isWatchingReplay) {
            return {
                text: "onlineMenu.lobby.watchingReplay",
                class: "watching",
                icon: "info",
            };
        }

        if (roomStatus === "playing") {
            return {
                text: "onlineMenu.playing",
                class: "playing",
                icon: "boxing-glove-pictogram-1",
            };
        }
        if (roomStatus === "finished") {
            return {
                text: "onlineMenu.lobby.viewingResults",
                class: "viewing-results",
                icon: "trophy_bronze",
            };
        }

        return {
            text: "onlineMenu.lobby.notReady",
            class: "not-ready",
            icon: "stopwatch_gold",
        };
    }

    function handleNameChange(e: CustomEvent<string>) {
        if (!e.detail.trim()) return;
        onUpdatePlayer({ name: e.detail });
    }
</script>

<div class="players-section">
    <div class="section-header">
        <h3>
            <SvgIcons name="handshake" width="24" height="24" />
            {$_("onlineMenu.players")}
            <span class="count-badge">{players.length}/8</span>
        </h3>
    </div>

    <div class="players-list" data-testid="players-list">
        {#each players as player (player.id)}
            {@const status = getPlayerStatus(player)}
            <div
                class="player-card"
                class:is-me={player.id === myPlayerId}
                class:is-ready={player.isReady}
                data-testid={`player-card-${player.id}`}
                animate:flip={{ duration: 300 }}
                in:fly={{ y: 20, duration: 300 }}
            >
                <div class="card-left">
                    {#if player.id === myPlayerId}
                        <div class="avatar-wrapper is-me">
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

                    <div class="player-details">
                        <div class="player-name-row">
                            <div class="player-name-wrapper-styled">
                                <EditableText
                                    value={player.name}
                                    canEdit={player.id === myPlayerId}
                                    onRandom={generateRandomPlayerName}
                                    on:change={handleNameChange}
                                    dataTestId={`player-name-${player.id}`}
                                />
                            </div>

                            {#if player.id === hostId}
                                <span
                                    class="badge host"
                                    data-testid="host-badge"
                                    title={$_("onlineMenu.lobby.host")}
                                >
                                    <SvgIcons
                                        name="trophy_bronze"
                                        width="12"
                                        height="12"
                                    />
                                    HOST
                                </span>
                            {/if}

                            {#if player.id === myPlayerId}
                                <span class="badge me">YOU</span>
                            {/if}
                        </div>
                    </div>
                </div>

                <div class="card-right">
                    <div
                        class="status-indicator {status.class}"
                        data-testid={`player-status-${player.id}`}
                    >
                        <SvgIcons name={status.icon} width="16" height="16" />
                        <span class="status-text">{$_(status.text)}</span>
                    </div>
                </div>
            </div>
        {/each}

        {#if players.length < 2 && roomStatus === "waiting"}
            <div class="waiting-card" in:fade>
                <div class="pulse-ring"></div>
                <p>{$_("onlineMenu.lobby.waitingForPlayers")}</p>
            </div>
        {/if}
    </div>

    <div class="actions-footer">
        <StyledButton
            variant={myPlayer?.isReady ? "default" : "primary"}
            size="large"
            on:click={onToggleReady}
            dataTestId="toggle-ready-btn"
            class="action-btn ready-btn"
            disabled={roomStatus !== "waiting"}
        >
            {#if myPlayer?.isReady}
                {$_("onlineMenu.lobby.notReady")}
            {:else}
                {$_("onlineMenu.lobby.ready")}
            {/if}
        </StyledButton>

        {#if amIHost}
            <!-- Separator -->
            <div class="separator"></div>

            <StyledButton
                variant="primary"
                size="large"
                disabled={!allReady}
                on:click={onStartGame}
                dataTestId="start-game-btn"
                class="action-btn start-btn"
            >
                <span class="btn-content">
                    <SvgIcons
                        name="boxing-glove-pictogram-1"
                        width="20"
                        height="20"
                    />
                    {$_("onlineMenu.lobby.startGame")}
                </span>
            </StyledButton>
        {/if}
    </div>
</div>

<style>
    .players-section {
        background: rgba(255, 255, 255, 0.03);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border-radius: 20px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        padding: 0;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        /* height: 100%; Removed to prevent stretching */
    }

    .section-header {
        padding: 20px 24px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .section-header h3 {
        margin: 0;
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 1.2rem;
        color: var(--text-primary);
    }

    .count-badge {
        font-size: 0.8em;
        padding: 4px 10px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        color: var(--text-secondary);
    }

    .players-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 24px;
        flex: 1;
    }

    .player-card {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding: 16px;
        background: rgba(0, 0, 0, 0.2);
        border-radius: 16px;
        border: 1px solid transparent;
        transition: all 0.3s ease;
    }

    .player-card.is-me {
        background: rgba(33, 150, 243, 0.1); /* Blue tint */
        border-color: rgba(33, 150, 243, 0.5); /* Blue border */
        box-shadow: 0 4px 20px rgba(33, 150, 243, 0.15); /* Blue glow */
    }

    .player-card.is-ready {
        border-left: 4px solid var(--success-color, #4caf50);
    }

    .card-left {
        display: flex;
        align-items: center;
        gap: 16px;
        flex: 1;
        min-width: 0;
    }

    .player-avatar {
        width: 48px;
        height: 48px;
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        font-size: 1.2rem;
        color: rgba(0, 0, 0, 0.7);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        flex-shrink: 0;
    }

    .avatar-wrapper {
        flex-shrink: 0;
    }

    .player-details {
        flex: 1;
        min-width: 0;
    }

    .player-name-row {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;
    }

    .player-name-wrapper-styled :global(input),
    .player-name-wrapper-styled :global(span) {
        font-weight: 700 !important;
        font-size: 1.1rem !important;
    }

    .badge {
        font-size: 0.65rem;
        font-weight: 800;
        padding: 2px 6px;
        border-radius: 6px;
        text-transform: uppercase;
        display: inline-flex;
        align-items: center;
        gap: 4px;
    }

    .badge.host {
        background: linear-gradient(135deg, #ffd700, #ffb300);
        color: #000;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .badge.me {
        background: rgba(255, 255, 255, 0.1);
        color: var(--text-secondary);
        border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .status-indicator {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.9em;
        font-weight: 600;
        padding: 6px 12px;
        border-radius: 10px;
        white-space: nowrap;
    }

    .status-indicator.ready {
        color: #4caf50;
        background: rgba(76, 175, 80, 0.1);
    }

    .status-indicator.not-ready {
        color: var(--text-secondary);
        opacity: 0.7;
    }

    .status-indicator.playing {
        color: #2196f3;
    }

    .waiting-card {
        padding: 32px;
        text-align: center;
        border: 2px dashed rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        color: var(--text-secondary);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
    }

    .pulse-ring {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: var(--text-secondary);
        opacity: 0.5;
        animation: pulse 2s infinite;
    }

    @keyframes pulse {
        0% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7);
        }
        70% {
            transform: scale(1);
            box-shadow: 0 0 0 10px rgba(255, 255, 255, 0);
        }
        100% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
        }
    }

    .actions-footer {
        padding: 24px;
        border-top: 1px solid rgba(255, 255, 255, 0.05);
        display: flex;
        flex-direction: column;
        gap: 16px;
        background: rgba(0, 0, 0, 0.1);
    }

    .separator {
        height: 1px;
        background: rgba(255, 255, 255, 0.05);
        width: 100%;
    }

    :global(.action-btn) {
        width: 100%;
        justify-content: center;
    }

    .btn-content {
        display: flex;
        align-items: center;
        gap: 8px;
    }
</style>
