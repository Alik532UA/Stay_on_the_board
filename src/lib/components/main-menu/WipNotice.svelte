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
