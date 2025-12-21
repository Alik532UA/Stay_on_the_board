<script lang="ts">
    import { _ } from "svelte-i18n";
    import { flip } from "svelte/animate";
    import { fly } from "svelte/transition";
    import SvgIcons from "$lib/components/SvgIcons.svelte";
    import ColorPicker from "$lib/components/local-setup/ColorPicker.svelte";
    import EditableText from "$lib/components/ui/EditableText.svelte";
    import { generateRandomPlayerName } from "$lib/utils/nameGenerator";
    import type { OnlinePlayer } from "$lib/types/online";
    import { createEventDispatcher } from "svelte";

    export let player: OnlinePlayer;
    export let myPlayerId: string;
    export let hostId: string;
    export let roomStatus: "waiting" | "playing" | "finished";

    const dispatch = createEventDispatcher();

    $: isMe = player.id === myPlayerId;
    $: status = getPlayerStatus(player, roomStatus);

    function getPlayerStatus(p: OnlinePlayer, status: string) {
        if (p.isReady) {
            return {
                text: "onlineMenu.lobby.ready",
                class: "ready",
                icon: "confirm",
            };
        }
        if (p.isWatchingReplay) {
            return {
                text: "onlineMenu.lobby.watchingReplay",
                class: "watching",
                icon: "info",
            };
        }

        if (status === "playing") {
            return {
                text: "onlineMenu.playing",
                class: "playing",
                icon: "boxing-glove-pictogram-1",
            };
        }
        if (status === "finished") {
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
        dispatch("update", { name: e.detail });
    }

    function handleColorChange(e: CustomEvent<{ value: string }>) {
        dispatch("update", { color: e.detail.value });
    }

    function getInitial(name: string): string {
        return name && name.length > 0 ? name[0].toUpperCase() : "?";
    }
</script>

<div
    style="--player-color: {player.color}"
    class="player-card"
    class:is-me={isMe}
    class:is-ready={player.isReady}
    data-testid={`player-card-${player.id}`}
>
    <div class="card-left">
        {#if isMe}
            <div class="avatar-wrapper is-me">
                <ColorPicker
                    value={player.color}
                    on:change={handleColorChange}
                />
            </div>
        {:else}
            <div class="player-avatar" style="background-color: {player.color}">
                {getInitial(player.name)}
            </div>
        {/if}

        <div class="player-details">
            <div class="player-name-row">
                <div class="player-name-wrapper-styled">
                    <EditableText
                        value={player.name || "Player"}
                        canEdit={isMe}
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
                        <SvgIcons name="trophy_bronze" width="12" height="12" />
                        HOST
                    </span>
                {/if}

                {#if isMe}
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

<style>
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
        background: color-mix(in srgb, var(--player-color) 10%, transparent);
        border-color: color-mix(in srgb, var(--player-color) 50%, transparent);
        box-shadow: 0 4px 20px
            color-mix(in srgb, var(--player-color) 15%, transparent);
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

    .status-indicator.watching {
        color: var(--text-accent);
    }

    .status-indicator.viewing-results {
        color: gold;
    }
</style>
