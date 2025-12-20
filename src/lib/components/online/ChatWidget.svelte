<script lang="ts">
    import { _ } from "svelte-i18n";
    import SvgIcons from "$lib/components/SvgIcons.svelte";
    import { fade, fly } from "svelte/transition";
    import { onMount, onDestroy, afterUpdate } from "svelte";
    import { roomService, type ChatMessage } from "$lib/services/roomService";
    import type { Unsubscribe } from "firebase/firestore";
    import StyledButton from "$lib/components/ui/StyledButton.svelte";
    import NotoEmoji from "$lib/components/NotoEmoji.svelte";

    export let roomId: string;
    export let playerId: string;
    export let playerName: string;
    export let playerColor: string = "#ffd700"; // Default gold

    // Новий проп для керування режимом відображення
    export let variant: "floating" | "embedded" = "floating";

    // Якщо embedded, чат завжди відкритий
    let isOpen = variant === "embedded";
    let messages: ChatMessage[] = [];
    let newMessage = "";
    let unsubscribe: Unsubscribe | null = null;
    let chatContainer: HTMLElement;
    let hasUnread = false;

    // Toggle chat visibility (тільки для floating)
    function toggleChat() {
        if (variant === "embedded") return;
        isOpen = !isOpen;
        if (isOpen) {
            hasUnread = false;
            setTimeout(() => {
                if (chatContainer)
                    chatContainer.scrollTop = chatContainer.scrollHeight;
            }, 50);
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

    afterUpdate(() => {
        if (isOpen && chatContainer) {
            // Auto-scroll logic can be improved, but keeping simple for now
        }
    });

    async function sendMessage() {
        if (!newMessage.trim()) return;
        const text = newMessage.trim();
        newMessage = "";
        await roomService.sendMessage(roomId, playerId, playerName, text);

        setTimeout(() => {
            if (chatContainer)
                chatContainer.scrollTop = chatContainer.scrollHeight;
        }, 50);
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Enter") {
            sendMessage();
        }
    }

    function getMessageStyle(msg: ChatMessage) {
        if (msg.senderId !== playerId) return "";
        let bg = playerColor;
        if (bg.startsWith("#") && bg.length === 7) {
            bg += "33";
        }
        let border = playerColor;
        if (border.startsWith("#") && border.length === 7) {
            border += "80";
        }
        return `background-color: ${bg}; border-color: ${border};`;
    }
</script>

<!-- 
    Якщо variant="embedded", ми не рендеримо обгортку .chat-widget-container, 
    а рендеримо .chat-window прямо в потоці документа з класом .embedded
-->

{#if variant === "floating"}
    <div class="chat-widget-container">
        {#if isOpen}
            <div class="chat-window" transition:fly={{ y: 20, duration: 300 }}>
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

                <div class="messages-list" bind:this={chatContainer}>
                    {#if messages.length === 0}
                        <div class="empty-chat">
                            {$_("onlineMenu.chat.empty")}
                        </div>
                    {/if}
                    {#each messages as msg (msg.id)}
                        <div
                            class="message"
                            class:my-message={msg.senderId === playerId}
                            style={getMessageStyle(msg)}
                        >
                            <div class="sender">{msg.senderName}</div>
                            <div class="text">{msg.text}</div>
                        </div>
                    {/each}
                </div>

                <div class="input-area">
                    <input
                        type="text"
                        bind:value={newMessage}
                        placeholder={$_("onlineMenu.chat.placeholder")}
                        on:keydown={handleKeydown}
                        maxlength="100"
                    />
                    <button
                        class="send-icon-btn"
                        on:click={sendMessage}
                        data-testid="chat-send-btn"
                    >
                        <SvgIcons name="arrow-up" width="18" height="18" />
                    </button>
                </div>
            </div>
        {/if}

        <button
            class="chat-fab"
            class:unread={hasUnread}
            on:click={toggleChat}
            aria-label="Toggle Chat"
        >
            {#if isOpen}
                <SvgIcons name="arrow-down" width="24" height="24" />
            {:else}
                <NotoEmoji name="speech_balloon" size="24px" />
            {/if}
            {#if hasUnread}
                <span class="unread-dot"></span>
            {/if}
        </button>
    </div>
{:else}
    <!-- EMBEDDED VARIANT -->
    <div class="chat-window embedded">
        <!-- Header is optional in embedded mode, usually handled by modal -->
        <div class="messages-list" bind:this={chatContainer}>
            {#if messages.length === 0}
                <div class="empty-chat">{$_("onlineMenu.chat.empty")}</div>
            {/if}
            {#each messages as msg (msg.id)}
                <div
                    class="message"
                    class:my-message={msg.senderId === playerId}
                    style={getMessageStyle(msg)}
                >
                    <div class="sender">{msg.senderName}</div>
                    <div class="text">{msg.text}</div>
                </div>
            {/each}
        </div>

        <div class="input-area">
            <input
                type="text"
                bind:value={newMessage}
                placeholder={$_("onlineMenu.chat.placeholder")}
                on:keydown={handleKeydown}
                maxlength="100"
            />
            <button
                class="send-icon-btn"
                on:click={sendMessage}
                data-testid="chat-send-btn"
            >
                <SvgIcons name="arrow-up" width="18" height="18" />
            </button>
        </div>
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

    .messages-list {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .empty-chat {
        margin: auto;
        color: var(--text-secondary);
        font-style: italic;
        font-size: 0.9em;
    }

    .message {
        max-width: 85%;
        padding: 8px 12px;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.08);
        align-self: flex-start;
        font-size: 0.9rem;
        line-height: 1.4;
        word-break: break-word;
    }

    .message.my-message {
        align-self: flex-end;
        color: var(--text-primary);
        border: 1px solid transparent;
    }

    .sender {
        font-size: 0.7em;
        opacity: 0.6;
        margin-bottom: 4px;
    }

    .input-area {
        padding: 12px;
        background: rgba(0, 0, 0, 0.2);
        border-top: 1px solid rgba(255, 255, 255, 0.05);
        display: flex;
        gap: 8px;
        align-items: center;
    }

    input {
        flex: 1;
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 20px;
        padding: 8px 12px;
        color: var(--text-primary);
        font-size: 0.9rem;
        transition: all 0.2s;
    }

    input:focus {
        outline: none;
        border-color: var(--text-accent);
        background: rgba(0, 0, 0, 0.5);
    }

    .send-icon-btn {
        width: 32px;
        height: 32px;
        min-width: 32px;
        min-height: 32px;
        flex: 0 0 32px;
        padding: 0;
        margin: 0;
        box-sizing: border-box;
        aspect-ratio: 1/1;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: var(--text-primary) !important;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: transform 0.2s;
        flex-shrink: 0;
    }

    .send-icon-btn :global(svg) {
        fill: currentColor;
    }

    .send-icon-btn:hover {
        transform: scale(1.1);
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
