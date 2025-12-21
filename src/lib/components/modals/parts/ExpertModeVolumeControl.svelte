<script lang="ts">
    import { _ } from "svelte-i18n";
    import SvgIcons from "../../SvgIcons.svelte";

    export let expertVolume: number = 0.3;

    $: volumePercentage = expertVolume * 100;
</script>

<div
    class="volume-control-container"
    style="--volume-percentage: {volumePercentage}%; position: relative;"
    data-testid="expert-mode-volume-container"
>
    <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        bind:value={expertVolume}
        class="volume-slider"
        aria-label={$_("voiceSettings.volume")}
        data-testid="expert-mode-volume-slider"
    />
    <span
        class="volume-thumb-svg"
        style="left: calc((100% - 32px) * {expertVolume});"
        data-testid="expert-mode-volume-thumb"
        ><SvgIcons name="boxing-glove-pictogram-1" /></span
    >
    <span class="volume-label" data-testid="expert-mode-volume-label"
        >{$_("voiceSettings.volumeLabel")}: {volumePercentage.toFixed(0)}%</span
    >
</div>

<style>
    /* Styles should be inherited from modal.css in parent or defined here if isolated */
</style>
