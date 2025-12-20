<script lang="ts">
    import { goto } from "$app/navigation";
    import { base } from "$app/paths";
    import { _ } from "svelte-i18n";
    import SvgIcons from "$lib/components/SvgIcons.svelte";
    import { logService } from "$lib/services/logService.js";
    import { currentLanguageFlagSvg } from "$lib/stores/derivedState";
    import { modalStore } from "$lib/stores/modalStore";
    import AuthModal from "$lib/components/modals/AuthModal.svelte";

    // Components
    import ThemeDropdown from "$lib/components/main-menu/ThemeDropdown.svelte";
    import LanguageDropdown from "$lib/components/main-menu/LanguageDropdown.svelte";

    export let onFeedback: () => void;

    let showThemeDropdown = false;
    let showLangDropdown = false;

    function closeAll() {
        showThemeDropdown = false;
        showLangDropdown = false;
    }

    function navigateTo(route: string) {
        logService.action(`Click: "Навігація: ${route}" (TopIconsBar)`);
        closeAll();
        goto(`${base}${route}`);
    }

    function toggleTheme() {
        showThemeDropdown = !showThemeDropdown;
        showLangDropdown = false;
    }

    function toggleLang() {
        showLangDropdown = !showLangDropdown;
        showThemeDropdown = false;
    }

    function openAuthModal() {
        logService.action('Click: "Account" (TopIconsBar)');
        modalStore.showModal({
            title: "",
            component: AuthModal,
            dataTestId: "auth-modal",
            buttons: [],
            variant: "menu",
            closeOnOverlayClick: true, // <--- FIX: Додано для закриття по кліку на фон
        });
    }
</script>

<div class="top-icons-bar">
    <!-- 1. Правила -->
    <button
        class="icon-btn"
        on:click={() => navigateTo("/rules")}
        title={$_("mainMenu.rules")}
        data-testid="top-rules-btn"
    >
        <span class="emoji">📝</span>
    </button>

    <!-- 2. Нагороди -->
    <button
        class="icon-btn"
        on:click={() => navigateTo("/rewards")}
        title={$_("rewards.pageTitle")}
        data-testid="top-rewards-btn"
    >
        <span class="emoji">🏆</span>
    </button>

    <!-- 3. Налаштування -->
    <button
        class="icon-btn"
        on:click={() => navigateTo("/settings")}
        title={$_("mainMenu.settings")}
        data-testid="top-settings-btn"
    >
        <span class="emoji">⚙️</span>
    </button>

    <!-- 4. Мова -->
    <div class="icon-wrapper">
        <button
            class="icon-btn"
            on:click={toggleLang}
            title={$_("mainMenu.language")}
            data-testid="top-language-btn"
        >
            <span class="icon-inner">{@html $currentLanguageFlagSvg}</span>
        </button>
    </div>

    <!-- 5. Тема -->
    <div class="icon-wrapper">
        <button
            class="icon-btn"
            on:click={toggleTheme}
            title={$_("mainMenu.theme")}
            data-testid="top-theme-btn"
        >
            <span class="icon-inner"><SvgIcons name="theme" /></span>
        </button>
    </div>

    <!-- 6. Керування (Desktop only) -->
    <button
        class="icon-btn desktop-only"
        on:click={() => navigateTo("/settings?tab=hotkeys")}
        title={$_("mainMenu.controls")}
        data-testid="top-controls-btn"
    >
        <span class="emoji">⌨️</span>
    </button>

    <!-- 7. Підтримати (Donate) -->
    <button
        class="icon-btn"
        on:click={() => navigateTo("/supporters")}
        title={$_("mainMenu.donate")}
        data-testid="top-donate-btn"
    >
        <span class="icon-inner"><SvgIcons name="donate" /></span>
    </button>

    <!-- 8. Зворотній зв'язок -->
    <button
        class="icon-btn"
        on:click={onFeedback}
        title={$_("ui.feedback.title")}
        data-testid="top-feedback-btn"
    >
        <span class="emoji">💬</span>
    </button>

    <!-- 9. Акаунт (Нова кнопка) -->
    <button
        class="icon-btn"
        on:click={openAuthModal}
        title={$_("mainMenu.account")}
        data-testid="top-account-btn"
    >
        <span class="emoji">👤</span>
    </button>
</div>

<!-- Глобальний бекдроп та контейнери для дропдаунів -->
{#if showThemeDropdown || showLangDropdown}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="dropdown-backdrop" on:click={closeAll}></div>

    {#if showThemeDropdown}
        <div class="centered-dropdown-container">
            <ThemeDropdown onClose={() => (showThemeDropdown = false)} />
        </div>
    {/if}

    {#if showLangDropdown}
        <div class="centered-dropdown-container">
            <LanguageDropdown onClose={() => (showLangDropdown = false)} />
        </div>
    {/if}
{/if}

<style>
    .top-icons-bar {
        position: absolute;
        top: 20px;
        left: 0;
        right: 0;
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        gap: 16px;
        z-index: 10;
        padding: 0 10px;
    }

    .icon-wrapper {
        position: relative;
    }

    .icon-btn {
        background: transparent;
        border: none;
        border-radius: 50%;
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition:
            transform 0.2s,
            background 0.2s;
        box-shadow: none;
        padding: 0;
        color: var(--text-primary);
    }

    .icon-btn:hover {
        transform: scale(1.1);
        background: rgba(255, 255, 255, 0.1);
    }

    .emoji {
        font-size: 1.5rem;
        line-height: 1;
    }

    .icon-inner {
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    :global(.icon-inner svg) {
        width: 100%;
        height: 100%;
        fill: currentColor;
    }

    .desktop-only {
        display: none;
    }

    @media (min-width: 768px) {
        .desktop-only {
            display: flex;
        }
        .top-icons-bar {
            gap: 24px;
        }
    }

    .centered-dropdown-container {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 10002;
        width: auto;
        max-width: 90vw;
    }

    .dropdown-backdrop {
        position: fixed;
        inset: 0;
        z-index: 10001;
        background: rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(4px);
    }
</style>