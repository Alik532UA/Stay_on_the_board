<script lang="ts">
    import { columnStyleMode } from "$lib/stores/columnStyleStore";
    import { layoutStore } from "$lib/stores/layoutStore";
    import { logService } from "$lib/services/logService.js";
    import { _ } from "svelte-i18n";
    import { blurOnClick } from "$lib/utils/actions";
    import { customTooltip } from "$lib/actions/customTooltip.js";
    import SvgIcons from "$lib/components/SvgIcons.svelte";
</script>

<div class="settings-expander__setting-item">
    <span class="settings-expander__label">{$_("ui.moveMenuItems")}</span>
    <div style="display: flex; gap: 12px;">
        <button
            data-testid="settings-expander-column-style-fixed-btn"
            class="settings-expander__square-btn"
            aria-label="Fixed mode"
            on:click={() => columnStyleMode.set("fixed")}
            class:active={$columnStyleMode === "fixed"}
        >
            <SvgIcons name="fixed" />
        </button>
        <button
            data-testid="settings-expander-column-style-editing-btn"
            class="settings-expander__square-btn"
            aria-label="Flexible mode"
            on:click={() => columnStyleMode.set("flexible")}
            class:active={$columnStyleMode === "flexible"}
        >
            <SvgIcons name="editing" />
        </button>
        <button
            data-testid="settings-expander-reset-layout-btn"
            class="settings-expander__square-btn"
            use:blurOnClick
            aria-label="Скинути положення меню"
            use:customTooltip={$_("ui.resetMenuLayout") ||
                "Скинути положення елементів меню"}
            on:click={() => layoutStore.resetLayout()}
        >
            <span
                style="width:50%;height:50%;display:flex;align-items:center;justify-content:center;"
            >
                <SvgIcons name="clear-cache" />
            </span>
        </button>
    </div>
</div>
