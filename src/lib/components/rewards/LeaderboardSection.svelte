<script lang="ts">
    import { onMount } from "svelte";
    import {
        leaderboardService,
        type LeaderboardEntry,
    } from "$lib/services/leaderboardService";
    import { userProfileStore } from "$lib/services/authService";

    let leaders: LeaderboardEntry[] = [];
    let isLoadingLeaders = true;
    let selectedBoardSize: number | "all" = "all";

    const boardSizes: { value: number | "all"; label: string }[] = [
        { value: "all", label: "Всі" },
        { value: 3, label: "3x3" },
        { value: 4, label: "4x4" },
        { value: 5, label: "5x5" },
        { value: 6, label: "6x6" },
        { value: 8, label: "8x8" },
    ];

    async function loadLeaderboard() {
        isLoadingLeaders = true;
        leaders = await leaderboardService.getTopPlayers(
            "timed",
            selectedBoardSize,
            10,
        );
        isLoadingLeaders = false;
    }

    function handleSizeFilter(size: number | "all") {
        selectedBoardSize = size;
        loadLeaderboard();
    }

    onMount(() => {
        loadLeaderboard();
    });
</script>

<div class="leaderboard-section">
    <div class="lb-header">
        <h2>Топ гравців</h2>
        <div class="filter-chips">
            {#each boardSizes as size}
                <button
                    class="chip"
                    class:active={selectedBoardSize === size.value}
                    on:click={() => handleSizeFilter(size.value)}
                >
                    {size.label}
                </button>
            {/each}
        </div>
    </div>

    <div class="leaderboard-table-wrapper">
        {#if isLoadingLeaders}
            <div class="loading">Завантаження рейтингу...</div>
        {:else if leaders.length === 0}
            <div class="empty">Поки що немає рекордів. Станьте першим!</div>
        {:else}
            <table class="leaderboard-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Гравець</th>
                        <th>Дошка</th>
                        <th>Рахунок</th>
                    </tr>
                </thead>
                <tbody>
                    {#each leaders as leader, i}
                        <tr class:me={leader.uid === $userProfileStore?.uid}>
                            <td class="rank">
                                {#if i === 0}🥇{:else if i === 1}🥈{:else if i === 2}🥉{:else}{i +
                                        1}{/if}
                            </td>
                            <td class="name">{leader.displayName}</td>
                            <td class="board-size"
                                >{leader.boardSize || "4x4"}</td
                            >
                            <td class="score">{leader.score}</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        {/if}
    </div>
</div>

<style>
    h2 {
        font-family: "M PLUS Rounded 1c", sans-serif;
        text-align: center;
        margin: 0;
        color: var(--text-accent);
        font-size: 1.4rem;
        margin-bottom: 10px;
        text-align: left;
    }

    /* Leaderboard Header & Filters */
    .lb-header {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-bottom: 10px;
    }

    .filter-chips {
        display: flex;
        gap: 8px;
        overflow-x: auto;
        padding-bottom: 4px;
        scrollbar-width: none;
    }
    .filter-chips::-webkit-scrollbar {
        display: none;
    }

    .chip {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid var(--border-color);
        border-radius: 16px;
        padding: 6px 12px;
        color: var(--text-secondary);
        cursor: pointer;
        white-space: nowrap;
        font-size: 0.9em;
        transition: all 0.2s;
    }

    .chip.active {
        background: var(--text-accent);
        color: var(--bg-secondary);
        border-color: var(--text-accent);
        font-weight: bold;
    }

    /* Leaderboard Table */
    .leaderboard-table-wrapper {
        background: var(--bg-secondary);
        border-radius: 12px;
        overflow: hidden;
        box-shadow: var(--unified-shadow);
        border: 1px solid var(--border-color);
    }

    .leaderboard-table {
        width: 100%;
        border-collapse: collapse;
    }

    .leaderboard-table th,
    .leaderboard-table td {
        padding: 12px 16px;
        text-align: left;
    }

    .leaderboard-table th {
        background: rgba(0, 0, 0, 0.2);
        font-weight: 600;
        color: var(--text-secondary);
        font-size: 0.9em;
    }

    .leaderboard-table tr {
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .leaderboard-table tr:last-child {
        border-bottom: none;
    }

    .leaderboard-table tr.me {
        background: rgba(var(--text-accent-rgb), 0.1);
        font-weight: bold;
    }

    .rank {
        width: 40px;
        text-align: center;
        font-size: 1.2em;
    }
    .score {
        text-align: right;
        font-weight: bold;
        color: var(--text-accent);
        font-size: 1.1em;
    }
    .board-size {
        color: var(--text-secondary);
        font-size: 0.9em;
    }

    .loading,
    .empty {
        padding: 20px;
        text-align: center;
        color: var(--text-secondary);
        font-style: italic;
    }
</style>
