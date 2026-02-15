<script lang="ts">
    import { boardStore } from "$lib/stores/boardStore";
    import { userActionService } from "$lib/services/userActionService";
    import { logService } from "$lib/services/logService";
    import { t } from "$lib/i18n/typedI18n";
    import { get } from "svelte/store";
    import Stepper from "$lib/components/ui/Stepper.svelte";

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

    $: displayValue = $boardStore
        ? `${$boardStore.boardSize}x${$boardStore.boardSize}`
        : "?";
</script>

<div class="settings-expander__setting-item">
    <span class="settings-expander__label">{$t("settings.boardSize")}</span>

    <!-- Використовуємо новий компонент Stepper -->
    <Stepper
        value={displayValue}
        dataTestId="settings-expander-size-adjuster"
        decreaseTestId="settings-expander-size-decrease-btn"
        increaseTestId="settings-expander-size-increase-btn"
        valueTestId="settings-expander-current-size"
        on:decrement={() => changeBoardSize(-1)}
        on:increment={() => changeBoardSize(1)}
    />
</div>
