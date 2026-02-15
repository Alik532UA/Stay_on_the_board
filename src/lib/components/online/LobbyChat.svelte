<script lang="ts">
    import { onMount, onDestroy, afterUpdate } from "svelte";
    import { roomService, type ChatMessage } from "$lib/services/roomService";
    import { t } from "$lib/i18n/typedI18n";
    import type { Unsubscribe } from "firebase/firestore";
    import StyledButton from "$lib/components/ui/StyledButton.svelte";
    import SvgIcons from "$lib/components/SvgIcons.svelte";

    export let roomId: string;
    export let playerId: string;
    export let playerName: string;

    let messages: ChatMessage[] = [];
    let newMessage = "";
    let unsubscribe: Unsubscribe | null = null;
    let chatContainer: HTMLElement;

    onMount(() => {
        unsubscribe = roomService.subscribeToChat(
            roomId,
            (msgs: ChatMessage[]) => {
                messages = msgs;
            },
        );
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
        newMessage = "";
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
            <div class="empty-chat">{$t("onlineMenu.chat.empty")}</div>
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
            placeholder={$t("onlineMenu.chat.placeholder")}
            on:keydown={handleKeydown}
            maxlength="100"
        />
        <StyledButton
            size="small"
            variant="primary"
            on:click={sendMessage}
            class="send-btn"
        >
            <SvgIcons name="arrow-up" width="16" height="16" />
            <!-- Using arrow as send icon -->
        </StyledButton>
    </div>
</div>

<style>
    .chat-container {
        display: flex;
        flex-direction: column;
        height: 100%;
        min-height: 250px;
        max-height: 400px; /* Limit height */
        background: transparent; /* Wrapper handles background */
        border-radius: 12px;
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
        margin-top: auto;
        margin-bottom: auto;
        font-size: 0.9em;
        opacity: 0.7;
    }

    .message {
        max-width: 85%;
        padding: 8px 12px;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.05); /* Glass child */
        align-self: flex-start;
        font-size: 0.9em;
        line-height: 1.4;
        word-break: break-word;
    }

    .message.my-message {
        align-self: flex-end;
        background: rgba(var(--text-accent-rgb, 255, 215, 0), 0.2);
        color: var(--text-primary);
        border: 1px solid rgba(var(--text-accent-rgb, 255, 215, 0), 0.1);
    }

    .sender {
        font-size: 0.7em;
        opacity: 0.6;
        margin-bottom: 2px;
    }

    .input-area {
        display: flex;
        padding: 10px;
        gap: 8px;
        border-top: 1px solid rgba(255, 255, 255, 0.05);
        background: rgba(0, 0, 0, 0.1);
        align-items: center;
    }

    input {
        flex: 1;
        background: rgba(0, 0, 0, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        padding: 8px 12px;
        color: var(--text-primary);
        font-family: inherit;
        transition: all 0.2s;
    }

    input:focus {
        outline: none;
        border-color: rgba(255, 255, 255, 0.3);
        background: rgba(0, 0, 0, 0.3);
    }

    input::placeholder {
        color: rgba(255, 255, 255, 0.3);
    }

    :global(.send-btn) {
        width: 36px !important;
        height: 36px !important;
        padding: 0 !important;
        border-radius: 8px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        min-width: unset !important;
    }
</style>
