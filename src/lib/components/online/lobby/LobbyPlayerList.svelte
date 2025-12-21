<script lang="ts">
    import { _ } from "svelte-i18n";
    import type { OnlinePlayer } from "$lib/types/online";
    import { flip } from "svelte/animate";
    import { fly, fade } from "svelte/transition";
    import SvgIcons from "$lib/components/SvgIcons.svelte";

    import LobbyPlayerCard from "./LobbyPlayerCard.svelte";
    import LobbyActionFooter from "./LobbyActionFooter.svelte";

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

    function handleUpdatePlayer(e: CustomEvent<Partial<OnlinePlayer>>) {
        onUpdatePlayer(e.detail);
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
            <div
                animate:flip={{ duration: 300 }}
                in:fly={{ y: 20, duration: 300 }}
                role="listitem"
            >
                <LobbyPlayerCard
                    {player}
                    {myPlayerId}
                    {hostId}
                    {roomStatus}
                    on:update={handleUpdatePlayer}
                />
            </div>
        {/each}

        {#if players.length < 2 && roomStatus === "waiting"}
            <div class="waiting-card" in:fade>
                <div class="pulse-ring"></div>
                <p>{$_("onlineMenu.lobby.waitingForPlayers")}</p>
            </div>
        {/if}
    </div>

    <LobbyActionFooter
        {amIHost}
        isMyPlayerReady={myPlayer?.isReady}
        {allReady}
        {roomStatus}
        on:toggleReady={onToggleReady}
        on:startGame={onStartGame}
    />
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

    /* Waiting Card Styles */
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
</style>
