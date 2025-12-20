<script lang="ts">
    import { appSettingsStore } from "$lib/stores/appSettingsStore.js";
    import { logService } from "$lib/services/logService.js";
    import { languages } from "$lib/constants";

    export let onClose: () => void;

    function selectLang(lang: string) {
        logService.action(`Click: "Мова: ${lang}" (LanguageDropdown)`);
        appSettingsStore.updateSettings({ language: lang });
        onClose();
    }
</script>

<div
    class="lang-dropdown"
    role="menu"
    tabindex="0"
    on:click={(e) => {
        e.stopPropagation();
    }}
    on:keydown={(e) => e.key === "Escape" && onClose()}
>
    {#each languages as lang}
        <button
            class="lang-option"
            on:click={() => selectLang(lang.code)}
            aria-label={lang.code}
            data-testid={`lang-option-${lang.code}`}
        >
            <div class="flag-icon-wrapper">
                {@html lang.svg}
            </div>
        </button>
    {/each}
</div>

<style>
    .lang-dropdown {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 1000;
        background: transparent;
        box-shadow: none;
        padding: 24px 32px;
        border-radius: 18px;
        /* FIX: Використовуємо змінну для адаптивної ширини */
        min-width: var(--responsive-min-width, 200px);
        width: auto;
        max-width: 95vw;
    }

    .lang-dropdown {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 64px;
    }

    .lang-dropdown.hidden {
        display: none !important;
    }

    .lang-option {
        background: transparent;
        border: none;
        border-radius: 8px;
        padding: 4px 8px;
        cursor: pointer;
        transition:
            transform 0.2s ease,
            background 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .lang-option:hover {
        transform: scale(1.1);
    }

    .lang-option.selected,
    .lang-option:focus {
        background: var(--control-selected, #ff9800);
        color: #fff;
    }

    .lang-option span {
        display: block;
    }

    /* FIX: Застосовуємо border-radius та overflow: hidden до обгортки SVG */
    .flag-icon-wrapper {
        border-radius: 8px; /* Заокруглення кутів */
        overflow: hidden; /* Приховуємо надлишок */
        display: flex; /* Для коректного центрування SVG */
        align-items: center;
        justify-content: center;
        /* Можливо, варто задати фіксовані розміри, якщо SVG не мають власних */
        width: 96px; /* Відповідає розміру SVG нижче */
        height: 72px; /* Відповідає розміру SVG нижче */
    }

    .lang-dropdown button {
        background: transparent !important;
        border: none !important;
        box-shadow: none !important;
        padding: 0;
        margin: 0;
        cursor: pointer;
        transition: transform 0.15s;
    }

    .lang-dropdown button:focus,
    .lang-dropdown button:hover {
        outline: none;
        transform: scale(1.08);
    }

    .lang-dropdown svg {
        width: 96px !important;
        height: 72px !important;
        display: block;
    }

    /* Overlays and Backdrops */
    .dropdown-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        z-index: 9998;
        transition: opacity 0.2s;
    }

    .dropdown-overlay.dark {
        background: rgba(24, 16, 32, 0.38);
    }

    .dropdown-overlay.light {
        background: rgba(255, 255, 255, 0.32);
    }

    .dropdown-overlay.hidden {
        display: none !important;
    }

    .dropdown-backdrop {
        z-index: 9999;
    }

    /* Ensure dropdowns are above overlays */
    .theme-dropdown,
    .lang-dropdown,
    .wip-notice-overlay {
        z-index: 10000;
    }

    @media (max-width: 600px) {
        .lang-dropdown {
            width: 96vw;
            max-width: var(--responsive-max-width);
        }
    }
</style>
