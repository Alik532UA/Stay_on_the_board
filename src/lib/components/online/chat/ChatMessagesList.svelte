<script lang="ts">
    import { _ } from "svelte-i18n";
    import type { ChatMessage } from "$lib/services/roomService";
    import { afterUpdate } from "svelte";

    export let messages: ChatMessage[] = [];
    export let playerId: string;
    export let playerColor: string;

    let chatContainer: HTMLElement;

    afterUpdate(() => {
        if (chatContainer) {
            // Simple auto-scroll
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    });

    function getMessageStyle(msg: ChatMessage) {
        if (msg.senderId !== playerId) return "";
        let bg = playerColor;
        if (bg.startsWith("#") && bg.length === 7) {
            bg += "33"; // 20% opacity
        }
        let border = playerColor;
        if (border.startsWith("#") && border.length === 7) {
            border += "80"; // 50% opacity
        }
        return `background-color: ${bg}; border-color: ${border};`;
    }
</script>

<!-- FIX: Додано data-testid для контейнера списку -->
<div
    class="messages-list"
    bind:this={chatContainer}
    data-testid="chat-messages-list"
>
    {#if messages.length === 0}
        <div class="empty-chat" data-testid="chat-empty-message">
            {$_("onlineMenu.chat.empty")}
        </div>
    {/if}
    {#each messages as msg (msg.id)}
        <!-- FIX: Додано data-testid для повідомлення -->
        <div
            class="message"
            class:my-message={msg.senderId === playerId}
            style={getMessageStyle(msg)}
            data-testid="chat-message-{msg.id}"
        >
            <div class="sender">{msg.senderName}</div>
            <div class="text">{msg.text}</div>
        </div>
    {/each}
</div>

<style>
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
</style>
