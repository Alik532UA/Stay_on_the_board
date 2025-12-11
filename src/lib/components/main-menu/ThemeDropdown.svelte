<script lang="ts">
    import { appSettingsStore } from "$lib/stores/appSettingsStore.js";
    import { logService } from "$lib/services/logService.js";
    import { _ } from "svelte-i18n";

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
    onclick={(e) => {
        e.stopPropagation();
    }}
    onkeydown={(e) => e.key === "Escape" && onClose()}
>
    <div class="theme-style-row" data-style="purple">
        <button
            class="theme-btn"
            data-theme="light"
            onclick={() => selectTheme("purple", "light")}
            data-testid="theme-purple-light-btn">☀️</button
        >
        <span class="theme-name">{$_("mainMenu.themeName.purple")}</span>
        <button
            class="theme-btn"
            data-theme="dark"
            onclick={() => selectTheme("purple", "dark")}
            data-testid="theme-purple-dark-btn">🌙</button
        >
    </div>
    <div class="theme-style-row" data-style="green">
        <button
            class="theme-btn"
            data-theme="light"
            onclick={() => selectTheme("green", "light")}
            data-testid="theme-green-light-btn">☀️</button
        >
        <span class="theme-name">{$_("mainMenu.themeName.green")}</span>
        <button
            class="theme-btn"
            data-theme="dark"
            onclick={() => selectTheme("green", "dark")}
            data-testid="theme-green-dark-btn">🌙</button
        >
    </div>
    <div class="theme-style-row" data-style="blue">
        <button
            class="theme-btn"
            data-theme="light"
            onclick={() => selectTheme("blue", "light")}
            data-testid="theme-blue-light-btn">☀️</button
        >
        <span class="theme-name">{$_("mainMenu.themeName.blue")}</span>
        <button
            class="theme-btn"
            data-theme="dark"
            onclick={() => selectTheme("blue", "dark")}
            data-testid="theme-blue-dark-btn">🌙</button
        >
    </div>
    <div class="theme-style-row" data-style="gray">
        <button
            class="theme-btn"
            data-theme="light"
            onclick={() => selectTheme("gray", "light")}
            data-testid="theme-gray-light-btn">☀️</button
        >
        <span class="theme-name">{$_("mainMenu.themeName.gray")}</span>
        <button
            class="theme-btn"
            data-theme="dark"
            onclick={() => selectTheme("gray", "dark")}
            data-testid="theme-gray-dark-btn">🌙</button
        >
    </div>
    <div class="theme-style-row" data-style="orange">
        <button
            class="theme-btn"
            data-theme="light"
            onclick={() => selectTheme("orange", "light")}
            data-testid="theme-orange-light-btn">☀️</button
        >
        <span class="theme-name">{$_("mainMenu.themeName.orange")}</span>
        <button
            class="theme-btn"
            data-theme="dark"
            onclick={() => selectTheme("orange", "dark")}
            data-testid="theme-orange-dark-btn">🌙</button
        >
    </div>
    <div class="theme-style-row" data-style="wood">
        <button
            class="theme-btn"
            data-theme="light"
            onclick={() => selectTheme("wood", "light")}
            data-testid="theme-wood-light-btn">☀️</button
        >
        <span class="theme-name">{$_("mainMenu.themeName.wood")}</span>
        <button
            class="theme-btn"
            data-theme="dark"
            onclick={() => selectTheme("wood", "dark")}
            data-testid="theme-wood-dark-btn">🌙</button
        >
    </div>
</div>
