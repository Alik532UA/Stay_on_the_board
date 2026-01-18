<script lang="ts">
    import { networkStatsStore } from '$lib/stores/networkStatsStore';
    import { fade } from 'svelte/transition';
    import prettyBytes from 'pretty-bytes';

    let expanded = false;

    function toggle() {
        expanded = !expanded;
    }

    function reset() {
        networkStatsStore.reset();
    }

    function formatTime(seconds: number): string {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
</script>

<div class="network-monitor" class:expanded>
    <div class="header" on:click={toggle}>
        <span class="indicator" class:active={$networkStatsStore.lastActivity && (Date.now() - $networkStatsStore.lastActivity < 1000)}></span>
        <span class="time">{formatTime($networkStatsStore.elapsedSeconds)}</span>
        <span class="label">Net:</span>
        <span class="value">{$networkStatsStore.reads}R / {$networkStatsStore.writes}W</span>
        <span class="value size">({prettyBytes($networkStatsStore.bytesReceived)})</span>
    </div>

    {#if expanded}
        <div class="details" transition:fade>
            <div class="stats-row">
                <span>Reads:</span> <strong>{$networkStatsStore.reads}</strong>
            </div>
            <div class="stats-row">
                <span>Writes:</span> <strong>{$networkStatsStore.writes}</strong>
            </div>
            <div class="stats-row">
                <span>Received:</span> <strong>{prettyBytes($networkStatsStore.bytesReceived)}</strong>
            </div>
            <div class="stats-row">
                <span>Sent:</span> <strong>{prettyBytes($networkStatsStore.bytesSent)}</strong>
            </div>
            <button class="reset-btn" on:click={reset}>Reset Stats</button>
            
            <div class="log-list">
                {#each $networkStatsStore.recentEvents as event}
                    <div class="log-item" class:read={event.type === 'read'} class:write={event.type === 'write'}>
                        <span class="type">{event.type === 'read' ? 'R' : 'W'}</span>
                        <span class="source">{event.source}</span>
                        <span class="size">{prettyBytes(event.size)}</span>
                    </div>
                {/each}
            </div>
        </div>
    {/if}
</div>

<style>
    .network-monitor {
        position: fixed;
        top: 10px;
        right: 10px;
        background: rgba(0, 0, 0, 0.85);
        color: #0f0;
        font-family: monospace;
        font-size: 24px; /* Було 12px */
        border-radius: 12px; /* Було 4px */
        z-index: 10000;
        border: 2px solid #444;
        overflow: hidden;
        width: 600px; /* Збільшено ширину */
        box-shadow: 0 0 30px rgba(0,0,0,0.7);
    }

    .header {
        padding: 15px 25px; /* Збільшено відступи */
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 20px;
        white-space: nowrap;
    }

    .header:hover {
        background: rgba(255, 255, 255, 0.1);
    }

    .indicator {
        width: 20px; /* Було 8px */
        height: 20px; /* Було 8px */
        border-radius: 50%;
        background: #333;
        transition: background 0.2s;
    }

    .indicator.active {
        background: #0f0;
        box-shadow: 0 0 15px #0f0;
    }

    .time {
        color: #ffd700;
        font-weight: bold;
        min-width: 60px;
    }

    .label {
        font-weight: bold;
        color: #aaa;
    }

    .value {
        color: #fff;
    }
    
    .value.size {
        color: #00e5ff;
        font-size: 0.8em;
    }

    .details {
        padding: 20px;
        border-top: 2px solid #444;
        background: rgba(0, 0, 0, 0.95);
    }

    .stats-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 12px;
    }

    .reset-btn {
        width: 100%;
        margin-top: 15px;
        background: #c62828;
        color: #fff;
        border: none;
        padding: 10px;
        cursor: pointer;
        font-size: 18px;
        font-weight: bold;
        border-radius: 8px;
    }

    .reset-btn:hover {
        background: #e53935;
    }

    .log-list {
        margin-top: 15px;
        max-height: 400px; /* Збільшено висоту логу */
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .log-item {
        display: flex;
        justify-content: space-between;
        font-size: 16px; /* Було 10px */
        padding: 6px 10px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 4px;
    }
    
    .log-item.read { color: #81d4fa; }
    .log-item.write { color: #ffab91; }

    .source {
        flex-grow: 1;
        margin: 0 15px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
</style>
