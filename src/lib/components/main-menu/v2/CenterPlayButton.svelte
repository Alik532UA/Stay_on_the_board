<script lang="ts">
    import { _ } from "svelte-i18n";
    import SvgIcons from "$lib/components/SvgIcons.svelte";

    export let onPlay: () => void;

    // Налаштування анімації
    const waveCount = 5;
    const duration = 5; // секунд
    const delayStep = duration / waveCount;
</script>

<div class="center-container">
    <button
        class="play-btn-circle"
        on:click={onPlay}
        data-testid="center-play-btn"
        aria-label={$_("mainMenu.virtualPlayer")}
    >
        <div class="play-icon">
            <SvgIcons name="piece" />
        </div>

        <!-- Хвилі анімації -->
        {#each Array(waveCount) as _, i}
            <div
                class="wave"
                style="
          animation-delay: {i * delayStep}s;
          animation-duration: {duration}s;
        "
            ></div>
        {/each}
    </button>
</div>

<style>
    .center-container {
        display: flex;
        align-items: center;
        justify-content: center;
        flex: 1;
        position: relative;
        /* Додаємо overflow: visible контейнеру, щоб великі хвилі (scale 5) не обрізалися, якщо контейнер малий */
        overflow: visible;
    }

    .play-btn-circle {
        width: 160px;
        height: 160px;
        border-radius: 50%;
        border: none;
        /* Фон як у гамбургера */
        background: var(--bg-secondary);

        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition:
            transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
            box-shadow 0.3s;
        position: relative;
        /* Важливо: overflow: visible, щоб хвилі виходили за межі кнопки */
        overflow: visible;
        z-index: 10;
    }

    .play-btn-circle:hover {
        transform: scale(1.05);
        box-shadow: 0 12px 48px rgba(0, 0, 0, 0.4);
        /* При наведенні трохи світліший фон */
        filter: brightness(1.2);
    }

    .play-btn-circle:active {
        transform: scale(0.95);
    }

    .play-icon {
        width: 60%;
        height: 60%;
        color: var(--text-primary);
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
        position: relative;
        z-index: 11; /* Іконка завжди зверху */
    }

    /* Стилі хвилі */
    .wave {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.1); /* Біла тінь */
        z-index: -1; /* Під кнопкою */
        pointer-events: none;
        opacity: 0;
        animation-name: pulse-in;
        animation-timing-function: linear;
        animation-iteration-count: infinite;
    }

    @keyframes pulse-in {
        0% {
            transform: scale(5); /* Розмах 5 */
            opacity: 0;
        }
        20% {
            opacity: 0.25; /* Прозорість 0.25 */
        }
        100% {
            transform: scale(1);
            opacity: 0;
        }
    }
</style>
