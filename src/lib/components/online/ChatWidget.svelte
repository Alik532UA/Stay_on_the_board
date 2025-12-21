<script lang="ts">
    import { _ } from "svelte-i18n";
    import SvgIcons from "$lib/components/SvgIcons.svelte";
    import { fly } from "svelte/transition";
    import { onMount, onDestroy } from "svelte";
    import { roomService, type ChatMessage } from "$lib/services/roomService";
    import type { Unsubscribe } from "firebase/firestore";
    import NotoEmoji from "$lib/components/NotoEmoji.svelte";
    import ChatMessagesList from "./chat/ChatMessagesList.svelte";
    import ChatInput from "./chat/ChatInput.svelte";

    export let roomId: string;
    export let playerId: string;
    export let playerName: string;
    export let playerColor: string = "#ffd700"; // Default gold
    export let variant: "floating" | "embedded" = "floating";

    let isOpen = variant === "embedded";
    let messages: ChatMessage[] = [];
    let unsubscribe: Unsubscribe | null = null;
    let hasUnread = false;

    // Toggle chat visibility (only for floating)
    function toggleChat() {
        if (variant === "embedded") return;
        isOpen = !isOpen;
        if (isOpen) {
            hasUnread = false;
        }
    }

    onMount(() => {
        unsubscribe = roomService.subscribeToChat(
            roomId,
            (msgs: ChatMessage[]) => {
                const prevLength = messages.length;
                messages = msgs;

                // If closed and new messages arrive, mark unread
                if (!isOpen && msgs.length > prevLength && prevLength > 0) {
                    hasUnread = true;
                }
            },
        );
    });

    onDestroy(() => {
        if (unsubscribe) unsubscribe();
    });

    async function handleSend(e: CustomEvent<string>) {
        const text = e.detail;
        await roomService.sendMessage(roomId, playerId, playerName, text);
    }
</script>

{#if variant === "floating"}
    <div class="chat-widget-container" data-testid="chat-widget-container">
        {#if isOpen}
            <div
                class="chat-window"
                transition:fly={{ y: 20, duration: 300 }}
                data-testid="chat-window"
            >
                <div class="chat-header">
                    <h3>{$_("onlineMenu.chat.title")}</h3>
                    <button
                        class="close-btn"
                        on:click={toggleChat}
                        data-testid="chat-close-btn"
                    >
                        <SvgIcons name="arrow-down" width="16" height="16" />
                    </button>
                </div>

                <ChatMessagesList {messages} {playerId} {playerColor} />
                <ChatInput on:send={handleSend} />
            </div>
        {/if}

        <button
            class="chat-fab"
            class:unread={hasUnread}
            on:click={toggleChat}
            aria-label="Toggle Chat"
            data-testid="chat-toggle-btn"
        >
            {#if isOpen}
                <SvgIcons name="arrow-down" width="24" height="24" />
            {:else}
                <NotoEmoji name="speech_balloon" size="24px" />
            {/if}
            {#if hasUnread}
                <span class="unread-dot" data-testid="chat-unread-dot"></span>
            {/if}
        </button>
    </div>
{:else}
    <!-- EMBEDDED VARIANT -->
    <div class="chat-window embedded" data-testid="chat-window-embedded">
        <ChatMessagesList {messages} {playerId} {playerColor} />
        <ChatInput on:send={handleSend} />
    </div>
{/if}

<style>
    .chat-widget-container {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 1000;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 16px;
    }

    .chat-fab {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: var(--control-bg);
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        color: var(--text-primary);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        position: relative;
    }

    .chat-fab:hover {
        transform: scale(1.05);
        background: var(--control-bg-hover);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
    }

    .chat-fab.unread {
        border-color: var(--text-accent);
        box-shadow: 0 0 0 2px rgba(var(--text-accent-rgb, 255, 215, 0), 0.3);
    }

    .unread-dot {
        position: absolute;
        top: 0;
        right: 0;
        width: 14px;
        height: 14px;
        background: red;
        border-radius: 50%;
        border: 2px solid #222;
    }

    .chat-window {
        width: 320px;
        height: 400px;
        background: rgba(30, 30, 30, 0.95);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border-radius: 20px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        transform-origin: bottom right;
    }

    /* Embedded overrides */
    .chat-window.embedded {
        width: 100%;
        height: 100%;
        background: transparent;
        backdrop-filter: none;
        border: none;
        box-shadow: none;
        border-radius: 0;
        transform: none;
    }

    .chat-header {
        padding: 16px;
        background: rgba(255, 255, 255, 0.05);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .chat-header h3 {
        margin: 0;
        font-size: 1rem;
        font-weight: 700;
        color: var(--text-primary);
    }

    .close-btn {
        background: none;
        border: none;
        color: var(--text-secondary);
        cursor: pointer;
        padding: 0;
        min-width: 32px;
        min-height: 32px;
        aspect-ratio: 1/1;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;
    }

    .close-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        color: var(--text-primary);
    }

    @media (max-width: 480px) {
        .chat-window:not(.embedded) {
            width: calc(100vw - 32px);
            right: 0;
        }

        .chat-widget-container {
            right: 16px;
            bottom: 16px;
            align-items: flex-end;
        }
    }
</style>
