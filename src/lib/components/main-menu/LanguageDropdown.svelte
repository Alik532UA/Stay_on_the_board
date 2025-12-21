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
                <!-- FIX: Використовуємо глобальний стиль для примусового розміру SVG -->
                {@html lang.svg}
            </div>
            <span class="lang-code">{lang.code.toUpperCase()}</span>
        </button>
    {/each}
</div>

<style>
    .lang-dropdown {
        background: transparent;
        padding: 16px;
        border-radius: 18px;
        width: 100%;
        min-width: 200px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
    }

    .lang-option {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 8px 16px;
        cursor: pointer;
        transition:
            transform 0.2s ease,
            background 0.2s;
        display: flex;
        align-items: center;
        justify-content: space-between; /* Прапор зліва, текст справа */
        width: 100%;
        max-width: 240px;
        backdrop-filter: blur(4px);
        height: 56px; /* Фіксована висота для стабільності */
        box-sizing: border-box;
    }

    .lang-option:hover {
        transform: scale(1.05);
        background: rgba(255, 255, 255, 0.2);
        border-color: rgba(255, 255, 255, 0.3);
    }

    .lang-option:active {
        transform: scale(0.98);
    }

    .flag-icon-wrapper {
        border-radius: 4px;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 48px;
        height: 36px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        flex-shrink: 0; /* Запобігає стисненню */
    }

    /* FIX: Примусово розтягуємо SVG на всю ширину обгортки */
    .flag-icon-wrapper :global(svg) {
        width: 100% !important;
        height: 100% !important;
        object-fit: cover;
        display: block;
    }

    .lang-code {
        font-weight: 800;
        color: #fff;
        font-size: 1.1rem;
        letter-spacing: 1px;
        margin-left: 16px;
    }
</style>
