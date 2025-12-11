<script lang="ts">
    import { onMount, onDestroy, afterUpdate } from "svelte";
    import { roomService, type ChatMessage } from "$lib/services/roomService";
    import { _ } from "svelte-i18n";
    import type { Unsubscribe } from "firebase/firestore";
    import StyledButton from "$lib/components/ui/StyledButton.svelte";

    export let roomId: string;
    export let playerId: string;
    export let playerName: string;

    let messages: ChatMessage[] = [];
    let newMessage = "";
    let unsubscribe: Unsubscribe | null = null;
    let chatContainer: HTMLElement;

    onMount(() => {
        unsubscribe = roomService.subscribeToChat(roomId, (msgs) => {
            messages = msgs;
        });
    });

    onDestroy(() => {
        if (unsubscribe) unsubscribe();
    });

    afterUpdate(() => {
        if (chatContainer) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    });

    async function sendMessage() {
        if (!newMessage.trim()) return;
        const text = newMessage.trim();
        newMessage = ""; // Очищаємо одразу для UX
        await roomService.sendMessage(roomId, playerId, playerName, text);
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Enter") {
            sendMessage();
        }
    }
</script>

<div class="chat-container">
    <div class="messages-list" bind:this={chatContainer}>
        {#if messages.length === 0}
            <div class="empty-chat">{$_("onlineMenu.chat.empty")}</div>
        {/if}
        {#each messages as msg (msg.id)}
            <div class="message" class:my-message={msg.senderId === playerId}>
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
        <StyledButton size="small" variant="primary" on:click={sendMessage}>
            ➤
        </StyledButton>
    </div>
</div>

<style>
    .chat-container {
        display: flex;
        flex-direction: column;
        height: 300px;
        background: rgba(0, 0, 0, 0.2);
        border-radius: 12px;
        border: 1px solid var(--border-color);
        overflow: hidden;
    }

    .messages-list {
        flex: 1;
        overflow-y: auto;
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .empty-chat {
        text-align: center;
        color: var(--text-secondary);
        font-style: italic;
        margin-top: 20px;
    }

    .message {
        max-width: 80%;
        padding: 8px 12px;
        border-radius: 12px;
        background: var(--bg-secondary);
        align-self: flex-start;
        font-size: 0.9em;
    }

    .message.my-message {
        align-self: flex-end;
        background: var(--control-selected);
        color: var(--control-selected-text);
    }

    .sender {
        font-size: 0.75em;
        opacity: 0.7;
        margin-bottom: 2px;
    }

    .input-area {
        display: flex;
        padding: 8px;
        gap: 8px;
        background: var(--bg-secondary);
        border-top: 1px solid var(--border-color);
    }

    input {
        flex: 1;
        background: var(--bg-primary);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        padding: 8px 12px;
        color: var(--text-primary);
    }

    input:focus {
        outline: none;
        border-color: var(--text-accent);
    }
</style>
