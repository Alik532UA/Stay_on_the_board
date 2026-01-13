<script lang="ts">
    import { EMOJI_CONFIG } from "$lib/config/emojiConfig";
    import { base } from "$app/paths";
    import { lucideMap } from "$lib/icons/lucideMapping";

    // Назва файлу без розширення (наприклад, "trophy")
    export let name: string;
    // Розмір (за замовчуванням як текст)
    export let size: string = "1.2em";
    // Додаткові класи
    let className: string = "";
    export { className as class };

    // Обчислюємо Lucide компонент
    $: LucideComponent = lucideMap[name];

    // Обчислюємо шлях до файлу для фолбеку
    $: currentStyle = EMOJI_CONFIG.style;
    $: src = `${base}${EMOJI_CONFIG.paths[currentStyle]}/${name}.svg`;

    // Колір для Lucide іконок (якщо ми в кольоровому режимі, можемо захотіти дефолтний акцент або currentColor)
    $: iconColor =
        currentStyle === "mono" ? "currentColor" : "var(--text-primary)";
</script>

{#if name}
    {#if LucideComponent}
        <div
            class="emoji-wrapper lucide-wrapper lucide-icon lucide lucide-{name} {currentStyle} {className}"
            style="--emoji-size: {size};"
            role="img"
            aria-label={name}
        >
            <svelte:component
                this={LucideComponent}
                {size}
                color={iconColor}
                strokeWidth={2}
            />
        </div>
    {:else}
        <div
            class="emoji-wrapper {currentStyle} {className}"
            style="--emoji-size: {size}; --emoji-url: url('{src}');"
            role="img"
            aria-label={name}
        >
            {#if currentStyle === "color"}
                <img {src} alt={name} />
            {:else}
                <div class="mono-mask"></div>
            {/if}
        </div>
    {/if}
{/if}

<style>
    .emoji-wrapper {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: var(--emoji-size);
        height: var(--emoji-size);
        vertical-align: middle;
        line-height: 1;
    }

    .lucide-wrapper {
        color: inherit;
    }

    /* Стилі для кольорового режиму */
    img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        display: block;
    }

    /* Стилі для монохромного режиму */
    .mono-mask {
        width: 100%;
        height: 100%;
        background-color: currentColor;
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
