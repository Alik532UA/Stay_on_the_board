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
            {@html lang.svg}
        </button>
    {/each}
</div>
