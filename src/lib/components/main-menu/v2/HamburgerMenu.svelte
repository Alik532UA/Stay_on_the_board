<script lang="ts">
    import SvgIcons from "$lib/components/SvgIcons.svelte";
    import { logService } from "$lib/services/logService.js";
    import { modalStore } from "$lib/stores/modalStore";
    import HamburgerMenuModal from "$lib/components/modals/HamburgerMenuModal.svelte";

    export let onPlay: () => void;
    export let onFeedback: () => void;

    function openMenu() {
        logService.action('Click: "Open Hamburger Menu"');
        modalStore.showModal({
            component: HamburgerMenuModal,
            dataTestId: "hamburger-menu-modal",
            // Передаємо колбеки як props у компонент
            props: {
                onPlay,
                onFeedback,
            },
            // ВАЖЛИВО: Використовуємо той самий варіант, що і GameModeModal
            variant: "menu",
            buttons: [], // Кнопок у футері немає
            closeOnOverlayClick: true,
        });
    }
</script>

<!-- Кнопка Гамбургер (справа внизу) -->
<button
    class="hamburger-btn"
    on:click={openMenu}
    data-testid="hamburger-menu-btn"
    aria-label="Menu"
>
    <SvgIcons name="hamburger-menu" />
</button>

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
</style>
