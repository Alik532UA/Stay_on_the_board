<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { hotkeyTooltip } from "$lib/actions/hotkeyTooltip.js";
    import type { MoveDirectionType } from "$lib/models/Piece";

    export let selectedDirection: MoveDirectionType | null = null;
    export let disabled: boolean = false;
    export let centerInfoProps: any = {};

    const dispatch = createEventDispatcher();

    const directions: (MoveDirectionType | null)[] = [
        "up-left",
        "up",
        "up-right",
        "left",
        null,
        "right",
        "down-left",
        "down",
        "down-right",
    ];

    const directionArrows: Record<string, string> = {
        "up-left": "↖",
        up: "↑",
        "up-right": "↗",
        left: "←",
        right: "→",
        "down-left": "↙",
        down: "↓",
        "down-right": "↘",
    };

    function getArrow(dir: string) {
        return directionArrows[dir] || "";
    }

    function handleDirection(dir: MoveDirectionType) {
        if (disabled) return;
        dispatch("direction", dir);
    }

    function handleCentral() {
        if (disabled) return;
        dispatch("central");
    }
</script>

<div class="directions-3x3">
    {#each directions as dir}
        {#if dir}
            <button
                class="dir-btn {selectedDirection === dir ? 'active' : ''}"
                use:hotkeyTooltip={dir}
                on:click={() => handleDirection(dir)}
                data-testid={`dir-btn-${dir}`}
                {disabled}
            >
                {getArrow(dir)}
            </button>
        {:else}
            <button
                id="center-info"
                class="control-btn center-info {centerInfoProps.class}"
                type="button"
                aria-label={centerInfoProps.aria}
                on:click={centerInfoProps.clickable ? handleCentral : undefined}
                tabindex="0"
                disabled={!centerInfoProps.clickable || disabled}
                style={centerInfoProps.backgroundColor
                    ? `background-color: ${centerInfoProps.backgroundColor} !important`
                    : ""}
                data-testid="center-info-btn"
            >
                {centerInfoProps.content}
            </button>
        {/if}
    {/each}
</div>

<style>
    .directions-3x3 {
        display: grid;
        grid-template-columns: repeat(3, 70px);
        grid-template-rows: repeat(3, 70px);
        gap: 14px;
        margin: 18px 0 10px 0;
        justify-content: center;
    }
</style>
