<script lang="ts">
    import { goto } from "$app/navigation";
    import { base } from "$app/paths";
    import { _ } from "svelte-i18n";
    import SvgIcons from "$lib/components/SvgIcons.svelte";
    import { logService } from "$lib/services/logService.js";
    import { fade, scale } from "svelte/transition";
    import { quintOut } from "svelte/easing";
    import { modalStore } from "$lib/stores/modalStore";
    import AuthModal from "$lib/components/modals/AuthModal.svelte";

    import FloatingBackButton from "$lib/components/FloatingBackButton.svelte";

    export let onPlay: () => void;
    export let onFeedback: () => void;

    let isMenuOpen = false;

    function toggleMenu() {
        isMenuOpen = !isMenuOpen;
        logService.ui(`[HamburgerMenu] Toggled: ${isMenuOpen}`);
    }

    function closeMenu() {
        isMenuOpen = false;
    }

    function navigateTo(route: string) {
        logService.action(`Click: "Навігація: ${route}" (HamburgerMenu)`);
        closeMenu();
        goto(`${base}${route}`);
    }

    function handleBackdropClick(e: MouseEvent) {
        if (e.target === e.currentTarget) {
            closeMenu();
        }
    }

    function openAuthModal() {
        logService.action('Click: "Account" (HamburgerMenu)');
        closeMenu();
        modalStore.showModal({
            title: "",
            component: AuthModal,
            dataTestId: "auth-modal",
            buttons: [],
        });
    }
</script>

<!-- Кнопка Гамбургер (справа внизу) -->
<button
    class="hamburger-btn"
    on:click={toggleMenu}
    data-testid="hamburger-menu-btn"
    aria-label="Menu"
>
    <SvgIcons name="hamburger-menu" />
</button>

<!-- Меню Оверлей -->
{#if isMenuOpen}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
        class="menu-overlay"
        transition:fade={{ duration: 200 }}
        on:click={handleBackdropClick}
        data-testid="menu-overlay"
    >
        <!-- Кнопка Назад -->
        <FloatingBackButton onClick={closeMenu} />

        <!-- Список кнопок по центру -->
        <div
            class="menu-list-centered"
            transition:scale={{ duration: 300, easing: quintOut, start: 0.9 }}
            data-testid="menu-list"
        >
            <button
                class="menu-item"
                on:click={() => {
                    closeMenu();
                    onPlay();
                }}
                data-testid="menu-item-play"
            >
                <span class="menu-icon">👑</span>
                <span class="menu-text">{$_("mainMenu.virtualPlayer")}</span>
            </button>

            <button
                class="menu-item"
                on:click={() => navigateTo("/rewards")}
                data-testid="menu-item-rewards"
            >
                <span class="menu-icon">🏆</span>
                <span class="menu-text">{$_("rewards.pageTitle")}</span>
            </button>

            <button
                class="menu-item"
                on:click={() => navigateTo("/rules")}
                data-testid="menu-item-rules"
            >
                <span class="menu-icon">📝</span>
                <span class="menu-text">{$_("mainMenu.rules")}</span>
            </button>

            <button
                class="menu-item"
                on:click={() => navigateTo("/settings")}
                data-testid="menu-item-settings"
            >
                <span class="menu-icon">⚙️</span>
                <span class="menu-text">{$_("mainMenu.settings")}</span>
            </button>

            <button
                class="menu-item"
                on:click={() => navigateTo("/settings?tab=hotkeys")}
                data-testid="menu-item-controls"
            >
                <span class="menu-icon">⌨️</span>
                <span class="menu-text">{$_("mainMenu.controls")}</span>
            </button>

            <button
                class="menu-item"
                on:click={() => navigateTo("/supporters")}
                data-testid="menu-item-supporters"
            >
                <span class="menu-icon">🪙</span>
                <span class="menu-text">{$_("mainMenu.supporters")}</span>
            </button>

            <button
                class="menu-item"
                on:click={() => {
                    closeMenu();
                    onFeedback();
                }}
                data-testid="menu-item-feedback"
            >
                <span class="menu-icon">💬</span>
                <span class="menu-text">{$_("ui.feedback.title")}</span>
            </button>

            <!-- Нова кнопка Акаунт -->
            <button
                class="menu-item"
                on:click={openAuthModal}
                data-testid="menu-item-account"
            >
                <span class="menu-icon">👤</span>
                <span class="menu-text">{$_("mainMenu.account")}</span>
            </button>
        </div>
    </div>
{/if}

<style>
    .hamburger-btn {
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 64px;
        height: 64px;
        border-radius: 50%;
        background: var(--bg-secondary);
        border: none;
        color: var(--text-primary);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
        z-index: 100;
        transition: transform 0.2s;
    }

    .hamburger-btn:hover {
        transform: scale(1.1);
    }

    .menu-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        z-index: 200;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .menu-list-centered {
        display: flex;
        flex-direction: column;
        gap: 12px;
        width: 100%;
        max-width: 320px;
        padding: 20px;
        background: transparent;
        box-shadow: none;
        border: none;
    }

    .menu-item {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px 24px;
        background: rgba(255, 255, 255, 0.1);
        border: none;
        border-radius: 16px;
        color: #fff;
        cursor: pointer;
        text-align: left;
        transition:
            transform 0.2s,
            background 0.2s;
        font-size: 1.2rem;
        font-weight: 600;
        backdrop-filter: blur(4px);
    }

    .menu-item:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: scale(1.02);
    }

    .menu-icon {
        font-size: 1.5rem;
        width: 32px;
        text-align: center;
    }
</style>
