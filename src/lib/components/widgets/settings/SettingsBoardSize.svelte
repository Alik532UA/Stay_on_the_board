<script lang="ts">
    import { boardStore } from "$lib/stores/boardStore";
    import { userActionService } from "$lib/services/userActionService";
    import { logService } from "$lib/services/logService";
    import { _ } from "svelte-i18n";
    import { get } from "svelte/store";

    function changeBoardSize(increment: number) {
        logService.action(
            `Click: "Змінити розмір дошки: ${increment > 0 ? "+" : ""}${increment}" (SettingsBoardSize)`,
        );
        const currentSize = get(boardStore)?.boardSize;
        if (typeof currentSize !== "number") return;
        const newSize = currentSize + increment;
        if (newSize >= 2 && newSize <= 9) {
            userActionService.changeBoardSize(newSize);
        }
    }
</script>

<div class="settings-expander__setting-item">
    <span class="settings-expander__label">{$_("settings.boardSize")}</span>
    <div class="settings-expander__size-adjuster">
        <button
            data-testid="settings-expander-size-decrease-btn"
            class="settings-expander__square-btn"
            on:click={() => changeBoardSize(-1)}
        >
            -
        </button>
        <span
            data-testid="settings-expander-current-size"
            class="settings-expander__current-size"
        >
            {$boardStore ? $boardStore.boardSize : "?"}x{$boardStore
                ? $boardStore.boardSize
                : "?"}
        </span>
        <button
            data-testid="settings-expander-size-increase-btn"
            class="settings-expander__square-btn"
            on:click={() => changeBoardSize(1)}
        >
            +
        </button>
    </div>
</div>
