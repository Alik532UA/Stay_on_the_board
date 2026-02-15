<script lang="ts">
    import { t } from "$lib/i18n/typedI18n";
    import SvgIcons from "$lib/components/SvgIcons.svelte";
    import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher();
    let newMessage = "";

    function sendMessage() {
        if (!newMessage.trim()) return;
        dispatch("send", newMessage.trim());
        newMessage = "";
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Enter") {
            sendMessage();
        }
    }
</script>

<div class="input-area">
    <input
        type="text"
        bind:value={newMessage}
        placeholder={$t("onlineMenu.chat.placeholder")}
        on:keydown={handleKeydown}
        maxlength="100"
        data-testid="chat-input-field"
    />
    <button
        class="send-icon-btn"
        on:click={sendMessage}
        data-testid="chat-send-btn"
    >
        <SvgIcons name="arrow-up" width="18" height="18" />
    </button>
</div>

<style>
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
</style>
