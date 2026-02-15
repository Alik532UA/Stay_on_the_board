<script lang="ts">
    import { fade, fly } from 'svelte/transition';
    import { _ } from 'svelte-i18n';
    import type { Notification, NotificationType } from '$lib/types/notification';
    import { notificationStore } from '$lib/stores/notificationStore';
    import NotoEmoji from '../NotoEmoji.svelte';

    export let notification: Notification;

    const icons: Record<NotificationType, string> = {
        error: 'cross_mark',
        warning: 'warning',
        success: 'check_mark_button',
        info: 'information',
        achievement: 'trophy'
    };

    function remove() {
        notificationStore.remove(notification.id);
    }
</script>

<div 
    class="toast-item {notification.type}" 
    transition:fly={{ y: 20, duration: 300 }}
    role="alert"
>
    <div class="icon">
        <NotoEmoji name={icons[notification.type]} size="24px" />
    </div>
    <div class="message">
        {#if notification.messageKey}
            {$_(notification.messageKey, { values: notification.messageValues })}
        {:else if notification.messageRaw}
            {notification.messageRaw}
        {/if}
    </div>
    <button class="close-btn" on:click={remove} aria-label="Закрити">
        <NotoEmoji name="multiplication_sign" size="16px" />
    </button>
</div>

<style>
    .toast-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        background: var(--bg-secondary);
        border: var(--global-border-width) solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        min-width: 280px;
        max-width: 400px;
        pointer-events: auto;
    }

    .toast-item.error { border-left: 4px solid var(--error-color, #f44336); }
    .toast-item.warning { border-left: 4px solid var(--warning-action-bg, #ff9800); }
    .toast-item.success { border-left: 4px solid var(--positive-score-color, #4caf50); }
    .toast-item.info { border-left: 4px solid var(--text-accent, #2196f3); }
    .toast-item.achievement { border-left: 4px solid var(--text-accent, #ffeb3b); }

    .icon {
        flex-shrink: 0;
        display: flex;
        align-items: center;
    }

    .message {
        flex-grow: 1;
        font-size: 0.95rem;
        font-weight: 500;
        color: var(--text-primary);
        line-height: 1.4;
    }

    .close-btn {
        background: none;
        border: none;
        padding: 4px;
        cursor: pointer;
        opacity: 0.6;
        transition: opacity 0.2s;
        display: flex;
        align-items: center;
    }

    .close-btn:hover {
        opacity: 1;
    }
</style>
