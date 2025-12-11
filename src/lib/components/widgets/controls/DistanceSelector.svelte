<script lang="ts">
    import { createEventDispatcher } from "svelte";

    export let distanceRows: number[][] = [];
    export let selectedDistance: number | null = null;
    export let disabled: boolean = false;

    const dispatch = createEventDispatcher();

    function handleDistance(dist: number) {
        if (disabled) return;
        dispatch("distance", dist);
    }
</script>

<div class="distance-select">
    <div class="distance-btns">
        {#each distanceRows as row}
            <div class="distance-row">
                {#each row as dist}
                    <button
                        class="dist-btn {selectedDistance === dist
                            ? 'active'
                            : ''}"
                        on:click={() => handleDistance(dist)}
                        data-testid={`dist-btn-${dist}`}
                        {disabled}
                    >
                        {dist}
                    </button>
                {/each}
            </div>
        {/each}
    </div>
</div>

<style>
    .distance-select {
        width: 100%;
        text-align: center;
        margin-top: 18px;
    }
    .distance-btns {
        display: flex;
        flex-direction: column;
        gap: 10px;
        justify-content: center;
        margin-top: 10px;
    }
    .distance-row {
        display: flex;
        gap: 18px;
        justify-content: center;
    }
</style>
