<script lang="ts">
    import { notificationStore } from "$lib/stores/notificationStore";
    import NotoEmoji from "$lib/components/NotoEmoji.svelte"; // Імпорт
    import { _ } from "svelte-i18n";
    import { flip } from "svelte/animate";
    import { fly } from "svelte/transition";

    $: notifications = $notificationStore;
</script>

<div class="notification-container">
    {#each notifications as notification (notification.id)}
        <div
            class="notification-toast {notification.type}"
            animate:flip={{ duration: 300 }}
            transition:fly={{ y: 50, duration: 300 }}
            role="alert"
        >
            {#if notification.icon}
                <div class="icon">
                    <!-- Заміна SvgIcons на NotoEmoji -->
                    <NotoEmoji name={notification.icon} size="40px" />
                </div>
            {/if}
            <div class="content">
                {#if notification.titleKey}
                    <div class="title">{$_(notification.titleKey)}</div>
                {/if}
                {#if notification.messageKey}
                    <div class="message">{$_(notification.messageKey)}</div>
                {:else if notification.messageRaw}
                    <div class="message">{notification.messageRaw}</div>
                {/if}
            </div>
        </div>
    {/each}
</div>

<style>
    /* Стилі залишаються без змін */
    .notification-container {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        flex-direction: column-reverse;
        gap: 10px;
        z-index: 10000;
        pointer-events: none;
        width: 90%;
        max-width: 400px;
    }

    .notification-toast {
        background: rgba(20, 20, 30, 0.95);
        backdrop-filter: blur(10px);
        border-radius: 12px;
        padding: 16px;
        display: flex;
        align-items: center;
        gap: 16px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
        border: var(--global-border-width) solid rgba(255, 255, 255, 0.1);
        pointer-events: auto;
        color: var(--text-primary);
    }

    .notification-toast.achievement {
        border-color: gold;
        background: linear-gradient(
            to right,
            rgba(255, 215, 0, 0.1),
            rgba(0, 0, 0, 0.9)
        );
    }

    .icon {
        width: 40px;
        height: 40px;
        /* color: gold; - NotoEmoji має свої кольори */
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .content {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .title {
        font-weight: bold;
        font-size: 1em;
        color: var(--text-accent);
    }

    .message {
        font-size: 0.9em;
        color: var(--text-secondary);
    }
</style>
