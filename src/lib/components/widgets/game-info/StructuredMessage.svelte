<script lang="ts">
    export let lines: Array<{
        type: "line";
        parts: Array<{
            type: "text" | "player";
            content?: string;
            name?: string;
            style?: string;
        }>;
    }>;
</script>

{#each lines as line}
    <div class="message-line">
        {#each line.parts as part}
            {#if part.type === "text"}
                <span>{part.content}</span>
            {:else if part.type === "player"}
                <span class="player-name-plate" style={part.style}
                    >{part.name}</span
                >
            {/if}
        {/each}
    </div>
{/each}

<style>
    .message-line {
        text-align: center;
        width: 100%;
    }

    :global(.player-name-plate) {
        display: inline-block;
        padding: 0px 8px;
        border-radius: 12px;
        color: #ffffff;
        font-weight: bold;
        text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.3);
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
        transition: all 0.3s ease;
    }
</style>
