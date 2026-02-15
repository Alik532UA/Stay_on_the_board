<script lang="ts">
    import { appSettingsStore } from "$lib/stores/appSettingsStore.js";
    import { logService } from "$lib/services/logService.js";
    import { _ } from "svelte-i18n";
    import NotoEmoji from "$lib/components/NotoEmoji.svelte";

    export let onClose: () => void;

    function selectTheme(
        style: "purple" | "green" | "blue" | "gray" | "orange" | "wood", 
        theme: "light" | "dark"
    ) {
        logService.action(`Click: "Тема: ${style} ${theme}" (ThemeDropdown)`);
        appSettingsStore.updateSettings({ style, theme });
        onClose();
    }

    const styles = ["purple", "green", "blue", "gray", "orange", "wood"] as const;
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
    {#each styles as style}
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

<style>
    .theme-dropdown {
        /* Стилі контейнера */
        background: transparent;
        padding: 16px;
        border-radius: 18px;
        width: 100%;
        min-width: 280px;
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    /* Рядки тем */
    .theme-style-row {
        border-radius: 12px;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 12px;
        justify-content: space-between;
        transition:
            transform 0.2s,
            box-shadow 0.2s;
        border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .theme-style-row:hover {
        transform: scale(1.02);
        z-index: 1;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    /* Кольори фону для кожного стилю (відновлено з theme-controls.css) */
    .theme-style-row[data-style="purple"] {
        background: rgba(124, 58, 237, 0.45);
        border-color: rgba(124, 58, 237, 0.6);
    }

    .theme-style-row[data-style="green"] {
        background: rgba(0, 200, 80, 0.4);
        border-color: rgba(0, 200, 80, 0.6);
    }

    .theme-style-row[data-style="blue"] {
        background: rgba(33, 150, 243, 0.4);
        border-color: rgba(33, 150, 243, 0.6);
    }

    .theme-style-row[data-style="gray"] {
        background: rgba(120, 120, 120, 0.3);
        border-color: rgba(120, 120, 120, 0.5);
        backdrop-filter: blur(8px);
    }

    .theme-style-row[data-style="orange"] {
        background: rgba(255, 224, 102, 0.45);
        border-color: rgba(255, 224, 102, 0.6);
    }

    .theme-style-row[data-style="wood"] {
        background: linear-gradient(90deg, #e2c9a0 0%, #c9a063 100%);
        border-color: #d4b483;
    }

    /* Назва теми */
    .theme-name {
        flex: 1;
        text-align: center;
        font-weight: 700;
        color: #fff;
        font-size: 1.1rem;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }

    /* Кнопки перемикання (Сонце/Місяць) */
    .theme-btn {
        background: rgba(0, 0, 0, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        padding: 0;
    }

    .theme-btn:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: scale(1.1);
    }

    .theme-btn:active {
        transform: scale(0.95);
    }

    /* Специфічні стилі для кнопок */
    .theme-btn[data-theme="light"] {
        background: rgba(255, 255, 255, 0.25);
    }

    .theme-btn[data-theme="dark"] {
        background: rgba(0, 0, 0, 0.3);
    }
</style>
