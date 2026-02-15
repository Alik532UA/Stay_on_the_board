<script lang="ts">
    import { appSettingsStore } from "$lib/stores/appSettingsStore.js";
    import { logService } from "$lib/services/logService.js";
    import { languages } from "$lib/constants";

    export let onClose: () => void;

    function selectLang(lang: "uk" | "en" | "crh" | "nl") {
        logService.action(`Click: "Мова: ${lang}" (LanguageDropdown)`);
        appSettingsStore.updateSettings({ language: lang });
        onClose();
    }
</script>

<div
    class="lang-dropdown"
    data-testid="lang-dropdown"
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
                <svelte:component this={lang.component} />
            </div>
        </button>
    {/each}
</div>

<style>
    .lang-dropdown {
        background: transparent;
        padding: 16px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 32px; /* Збільшено відступи між прапорами */
    }

    .lang-option {
        background: transparent;
        border: none;
        padding: 4px;
        cursor: pointer;
        transition: transform 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        width: auto;
    }

    .lang-option:hover {
        transform: scale(1.05);
    }

    .lang-option:active {
        transform: scale(0.98);
    }

    .flag-icon-wrapper {
        border-radius: 8px; /* Більше заокруглення для великих прапорів */
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 112px; /* Значно більші прапори */
        height: 84px;
        flex-shrink: 0;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); /* Додано тінь для об'єму */
    }

    /* FIX: Примусово розтягуємо SVG на всю ширину обгортки */
    .flag-icon-wrapper :global(svg) {
        width: 100% !important;
        height: 100% !important;
        object-fit: cover;
        display: block;
    }
</style>
