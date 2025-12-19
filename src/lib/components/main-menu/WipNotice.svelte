<script lang="ts">
    import { logService } from "$lib/services/logService.js";
    import { _ } from "svelte-i18n";
    import { goto } from "$app/navigation";
    import { base } from "$app/paths";

    export let onClose: () => void;

    function handleDonate() {
        logService.action('Click: "Donate" (WipNotice)');
        goto(`${base}/supporters`);
    }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<div
    class="wip-notice-overlay"
    role="dialog"
    tabindex="0"
    on:click={(e) => {
        e.stopPropagation();
    }}
    on:keydown={(e) => e.key === "Escape" && onClose()}
>
    <div class="wip-notice-content">
        <button
            class="wip-close-btn"
            on:click={onClose}
            data-testid="wip-notice-close-btn">×</button
        >
        <h3>{$_("mainMenu.wipNotice.title")}</h3>
        <p>{$_("mainMenu.wipNotice.description")}</p>
        <button
            class="wip-donate-btn"
            on:click={handleDonate}
            data-testid="wip-notice-donate-btn"
        >
            {$_("mainMenu.donate")}
        </button>
    </div>
</div>

<style>
    .wip-notice-overlay {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 10000; /* Ensure it's above other modals */
        width: 90vw;
        max-width: 400px;
    }
    .wip-notice-content {
        position: relative;
        background: var(--bg-secondary);
        color: var(--text-primary);
        padding: 28px 32px;
        border-radius: 18px;
        text-align: center;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        border: var(--global-border-width) solid rgba(255, 255, 255, 0.1);
    }
    .wip-notice-content h3 {
        font-size: 1.4em;
        margin: 0 0 12px 0;
        color: var(--text-accent);
    }
    .wip-notice-content p {
        margin: 0 0 24px 0;
        line-height: 1.5;
        font-size: 1.05em;
    }
    .wip-donate-btn {
        background: var(--warning-action-bg);
        color: var(--warning-action-text);
        border: none;
        border-radius: 10px;
        padding: 12px 32px;
        font-weight: bold;
        cursor: pointer;
        font-size: 1.1em;
        transition: all 0.2s ease;
    }
    .wip-donate-btn:hover {
        transform: scale(1.05);
        box-shadow: 0 4px 16px var(--warning-action-bg);
    }
    .wip-close-btn {
        position: absolute;
        top: 10px;
        right: 10px;
        background: none;
        border: none;
        font-size: 2em;
        color: var(--text-primary);
        cursor: pointer;
        opacity: 0.7;
        transition: opacity 0.2s;
    }
    .wip-close-btn:hover {
        opacity: 1;
    }
</style>
