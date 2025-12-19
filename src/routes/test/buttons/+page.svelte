<script lang="ts">
    import StyledButton from "$lib/components/ui/StyledButton.svelte";
    import "$lib/css/components/modal.css";
    import "$lib/css/layouts/main-menu.css";
    import SvgIcons from "$lib/components/SvgIcons.svelte";

    let keys: string[] = [];
    function logClick(name: string) {
        keys = [...keys, `Clicked: ${name}`];
        setTimeout(() => {
            const el = document.getElementById("log-container");
            if (el) el.scrollTop = el.scrollHeight;
        }, 10);
    }
</script>

<div class="test-container">
    <h1>Button Unification Verification</h1>

    <div class="comparison-section">
        <h2>1. Modal Buttons (Generic)</h2>
        <div class="grid-header">
            <div>Legacy (modal.css)</div>
            <div>New (StyledButton)</div>
        </div>

        <!-- Default / Secondary -->
        <div class="row">
            <div class="cell">
                <button
                    class="modal-btn-generic"
                    on:click={() => logClick("Legacy Default")}
                >
                    Default
                </button>
            </div>
            <div class="cell">
                <StyledButton
                    variant="default"
                    on:click={() => logClick("New Default")}
                >
                    Default
                </StyledButton>
            </div>
        </div>

        <!-- Primary / Green -->
        <div class="row">
            <div class="cell">
                <button
                    class="modal-btn-generic green-btn"
                    on:click={() => logClick("Legacy Primary")}
                >
                    Primary / Green
                </button>
            </div>
            <div class="cell">
                <StyledButton
                    variant="primary"
                    on:click={() => logClick("New Primary")}
                >
                    Primary
                </StyledButton>
            </div>
        </div>

        <!-- Info / Blue -->
        <div class="row">
            <div class="cell">
                <button
                    class="modal-btn-generic blue-btn"
                    on:click={() => logClick("Legacy Info")}
                >
                    Info / Blue
                </button>
            </div>
            <div class="cell">
                <StyledButton
                    variant="info"
                    on:click={() => logClick("New Info")}
                >
                    Info
                </StyledButton>
            </div>
        </div>

        <!-- Danger / Red -->
        <div class="row">
            <div class="cell">
                <button
                    class="modal-btn-generic danger-btn"
                    on:click={() => logClick("Legacy Danger")}
                >
                    Danger
                </button>
            </div>
            <div class="cell">
                <StyledButton
                    variant="danger"
                    on:click={() => logClick("New Danger")}
                >
                    Danger
                </StyledButton>
            </div>
        </div>

        <!-- Disabled -->
        <div class="row">
            <div class="cell">
                <button class="modal-btn-generic" disabled> Disabled </button>
            </div>
            <div class="cell">
                <StyledButton variant="default" disabled>Disabled</StyledButton>
            </div>
        </div>
    </div>

    <div class="comparison-section">
        <h2>2. Main Menu Buttons</h2>
        <p>Note: Legacy requires #main-menu-buttons wrapper.</p>
        <div class="grid-header">
            <div>Legacy (main-menu.css)</div>
            <div>New (StyledButton)</div>
        </div>

        <!-- Menu Secondary -->
        <div class="row">
            <div class="cell">
                <div id="main-menu-buttons" style="margin:0; width: auto;">
                    <button
                        class="modal-button secondary"
                        on:click={() => logClick("Legacy Menu")}
                    >
                        Menu Button
                    </button>
                </div>
            </div>
            <div class="cell">
                <StyledButton
                    variant="menu"
                    size="large"
                    on:click={() => logClick("New Menu")}
                >
                    Menu Button
                </StyledButton>
            </div>
        </div>

        <!-- Menu Secondary with Icon -->
        <div class="row">
            <div class="cell">
                <div id="main-menu-buttons" style="margin:0; width: auto;">
                    <button
                        class="modal-button secondary"
                        on:click={() => logClick("Legacy Menu Icon")}
                    >
                        <span class="icon-spacer" style="margin-right: 8px;"
                            ><SvgIcons name="trophy_bronze" /></span
                        >
                        <span class="text">Rewards</span>
                    </button>
                </div>
            </div>
            <div class="cell">
                <StyledButton
                    variant="menu"
                    size="large"
                    on:click={() => logClick("New Menu Icon")}
                >
                    <span slot="icon" style="margin-right: 0px;"
                        ><SvgIcons name="trophy_bronze" /></span
                    >
                    Rewards
                </StyledButton>
            </div>
        </div>
    </div>

    <div class="comparison-section">
        <h2>3. Shape Variations</h2>
        <div class="row">
            <div class="cell">
                <span>Circle (Menu Variant)</span>
            </div>
            <div class="cell">
                <StyledButton
                    variant="menu"
                    shape="circle"
                    on:click={() => logClick("Circle Menu")}
                >
                    <span slot="icon"><SvgIcons name="trophy_bronze" /></span>
                </StyledButton>
            </div>
        </div>
        <div class="row">
            <div class="cell">
                <span>Circle (Primary Variant)</span>
            </div>
            <div class="cell">
                <StyledButton
                    variant="primary"
                    shape="circle"
                    on:click={() => logClick("Circle Primary")}
                >
                    <span slot="icon">▶</span>
                </StyledButton>
            </div>
        </div>
    </div>

    <div class="log-panel">
        <h3>Interaction Log</h3>
        <div id="log-container" class="log-container">
            {#each keys as key}
                <div>{key}</div>
            {/each}
        </div>
        <StyledButton
            size="small"
            variant="default"
            on:click={() => (keys = [])}>Clear Log</StyledButton
        >
    </div>
</div>

<style>
    .test-container {
        padding: 40px;
        background: #333; /* Dark bg to test contrast */
        color: #fff;
        min-height: 100vh;
    }
    .comparison-section {
        margin-bottom: 40px;
        background: rgba(0, 0, 0, 0.2);
        padding: 20px;
        border-radius: 16px;
    }
    .grid-header {
        display: grid;
        grid-template-columns: 1fr 1fr;
        font-weight: bold;
        margin-bottom: 20px;
        border-bottom: 1px solid #555;
        padding-bottom: 10px;
        text-align: center;
    }
    .row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        margin-bottom: 20px;
        align-items: center;
    }
    .cell {
        display: flex;
        justify-content: center;
        align-items: center;
        background: rgba(255, 255, 255, 0.05); /* See bounding box */
        padding: 20px;
        border-radius: 8px;
    }
    .log-panel {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 300px;
        background: #222;
        border: var(--global-border-width) solid #555;
        padding: 10px;
        border-radius: 8px;
    }
    .log-container {
        height: 100px;
        overflow-y: auto;
        font-family: monospace;
        font-size: 0.8em;
        margin-bottom: 10px;
        border: var(--global-border-width) solid #444;
        padding: 5px;
    }
</style>
