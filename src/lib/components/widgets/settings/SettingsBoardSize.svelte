<script lang="ts">
    import { boardStore } from "$lib/stores/boardStore";
    import { userActionService } from "$lib/services/userActionService.js";
    import { logService } from "$lib/services/logService.js";
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
            data-testid="decrease-board-size-btn"
            class="settings-expander__square-btn"
            on:click={() => changeBoardSize(-1)}
        >
            -
        </button>
        <span
            data-testid="current-board-size"
            class="settings-expander__current-size"
        >
            {$boardStore ? $boardStore.boardSize : "?"}x{$boardStore
                ? $boardStore.boardSize
                : "?"}
        </span>
        <button
            data-testid="increase-board-size-btn"
            class="settings-expander__square-btn"
            on:click={() => changeBoardSize(1)}
        >
            +
        </button>
    </div>
</div>
