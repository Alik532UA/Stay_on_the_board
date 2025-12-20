<script lang="ts">
    import { appSettingsStore } from "$lib/stores/appSettingsStore.js";
    import { logService } from "$lib/services/logService.js";
    import { _ } from "svelte-i18n";
    import NotoEmoji from "$lib/components/NotoEmoji.svelte";

    export let onClose: () => void;

    function selectTheme(style: string, theme: string) {
        logService.action(`Click: "Тема: ${style} ${theme}" (ThemeDropdown)`);
        appSettingsStore.updateSettings({ style, theme });
        onClose();
    }
</script>

<div
    class="theme-dropdown"
    role="dialog"
    tabindex="0"
    aria-modal="true"
    aria-label={$_("mainMenu.themeDropdown")}
    on:click={(e) => {
        e.stopPropagation();
    }}
    on:keydown={(e) => e.key === "Escape" && onClose()}
>
    {#each ["purple", "green", "blue", "gray", "orange", "wood"] as style}
        <div class="theme-style-row" data-style={style}>
            <button
                class="theme-btn"
                data-theme="light"
                on:click={() => selectTheme(style, "light")}
                data-testid={`theme-${style}-light-btn`}
            >
                <NotoEmoji name="sun" size="20px" />
            </button>
            <span class="theme-name">{$_(`mainMenu.themeName.${style}`)}</span>
            <button
                class="theme-btn"
                data-theme="dark"
                on:click={() => selectTheme(style, "dark")}
                data-testid={`theme-${style}-dark-btn`}
            >
                <NotoEmoji name="crescent_moon" size="20px" />
            </button>
        </div>
    {/each}
</div>
