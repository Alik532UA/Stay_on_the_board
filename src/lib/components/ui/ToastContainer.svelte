<script lang="ts">
    import { notificationStore } from '$lib/stores/notificationStore';
    import Toast from './Toast.svelte';
    import { flip } from 'svelte/animate';

    $: notifications = $notificationStore;
</script>

<div class="toast-container" aria-live="polite">
    {#each notifications as notification (notification.id)}
        <div animate:flip={{ duration: 300 }}>
            <Toast {notification} />
        </div>
    {/each}
</div>

<style>
    .toast-container {
        position: fixed;
        top: 24px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 11000; /* Above modals and tooltips */
        display: flex;
        flex-direction: column;
        gap: 12px;
        pointer-events: none; /* Let clicks pass through empty space */
        width: max-content;
        max-width: 90vw;
    }
</style>
