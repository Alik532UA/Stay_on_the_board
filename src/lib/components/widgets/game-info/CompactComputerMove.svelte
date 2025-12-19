<script lang="ts">
    export let message: { part1: string; move: string; part2: string };
</script>

<div class="compact-message-line">
    <span>{message.part1}</span>
    <span class="compact-move-display">{message.move}</span>
</div>
<span>{message.part2}</span>

<style>
    :global(.compact-move-display) {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: orange !important;
        color: #fff !important;
        font-weight: bold !important;
        border-radius: 12px;
        padding: 2px 10px;
        margin: 0 4px;
        font-family: "M PLUS Rounded 1c", sans-serif !important;
        min-width: 40px;
        min-height: 28px;
        font-size: 1.1em;
    }

    .compact-message-line {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        flex-wrap: wrap;
    }
</style>
