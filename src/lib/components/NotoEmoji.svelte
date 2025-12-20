<script lang="ts">
    import { EMOJI_CONFIG } from "$lib/config/emojiConfig";
    import { base } from "$app/paths";

    // Назва файлу без розширення (наприклад, "trophy")
    export let name: string;
    // Розмір (за замовчуванням як текст)
    export let size: string = "1.2em";

    // Обчислюємо шлях до файлу
    $: currentStyle = EMOJI_CONFIG.style;
    // Додаємо base path, щоб коректно працювало на GitHub Pages
    $: src = `${base}${EMOJI_CONFIG.paths[currentStyle]}/${name}.svg`;
</script>

{#if name}
    <div
        class="emoji-wrapper {currentStyle}"
        style="--emoji-size: {size}; --emoji-url: url('{src}');"
        role="img"
        aria-label={name}
    >
        {#if currentStyle === "color"}
            <!-- Кольоровий режим: просто картинка -->
            <img {src} alt={name} />
        {:else}
            <!-- Монохромний режим: CSS маска (приймає колір тексту) -->
            <div class="mono-mask"></div>
        {/if}
    </div>
{/if}

<style>
    .emoji-wrapper {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: var(--emoji-size);
        height: var(--emoji-size);
        vertical-align: middle;
        line-height: 1; /* Важливо для вирівнювання */
    }

    /* Стилі для кольорового режиму */
    img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        display: block; /* Прибираємо відступи inline-елементів */
    }

    /* Стилі для монохромного режиму */
    .mono-mask {
        width: 100%;
        height: 100%;
        background-color: currentColor; /* Магія: бере колір тексту батька */

        /* Використовуємо SVG як маску */
        -webkit-mask-image: var(--emoji-url);
        mask-image: var(--emoji-url);

        -webkit-mask-size: contain;
        mask-size: contain;

        -webkit-mask-repeat: no-repeat;
        mask-repeat: no-repeat;

        -webkit-mask-position: center;
        mask-position: center;
    }
</style>
