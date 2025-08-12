<script lang="ts">
  import { testModeStore, type PositionMode, type ComputerMoveMode } from '$lib/stores/testModeStore';
  import { logService } from '$lib/services/logService.js';

  let manualDirection: string | null = null;
  let manualDistance: number | null = null;

  function setStartPositionMode(mode: PositionMode) {
    testModeStore.update(state => ({ ...state, startPositionMode: mode }));
  }

  function setComputerMoveMode(mode: ComputerMoveMode) {
    testModeStore.update(state => ({ ...state, computerMoveMode: mode, manualComputerMove: { direction: null, distance: null } }));
  }

  function handleDirection(dir: string) {
    manualDirection = dir;
    if (manualDirection && manualDistance) {
      setManualComputerMove(manualDirection, manualDistance);
    }
  }

  function handleDistance(dist: number) {
    manualDistance = dist;
    if (manualDirection && manualDistance) {
      setManualComputerMove(manualDirection, manualDistance);
    }
  }

  function setManualComputerMove(direction: string, distance: number) {
    const newState: Partial<import('$lib/stores/testModeStore').TestModeState> = {
      computerMoveMode: 'manual',
      manualComputerMove: { direction, distance }
    };
    testModeStore.update(state => {
      const updatedState = { ...state, ...newState };
      logService.testMode('TestModeWidget: оновлено testModeStore', updatedState);
      return updatedState;
    });
  }
</script>

<div class="test-mode-widget">
  <h3>Test Mode Controls</h3>

  <div class="control-group">
    <h4>Start Position</h4>
    <div class="btn-group">
      <button on:click={() => setStartPositionMode('random')} class:active={$testModeStore.startPositionMode === 'random'}>Випадково</button>
      <button on:click={() => setStartPositionMode('predictable')} class:active={$testModeStore.startPositionMode === 'predictable'}>Передбачувано (0,0)</button>
    </div>
  </div>

  <div class="control-group">
    <h4>Computer's Next Move</h4>
    <div class="btn-group">
        <button on:click={() => setComputerMoveMode('random')} class:active={$testModeStore.computerMoveMode === 'random'}>Випадково</button>
    </div>
    <div class="directions-3x3">
      <button class="dir-btn {manualDirection === 'up-left' ? 'active' : ''}" on:click={() => handleDirection('up-left')}>↖</button>
      <button class="dir-btn {manualDirection === 'up' ? 'active' : ''}" on:click={() => handleDirection('up')}>↑</button>
      <button class="dir-btn {manualDirection === 'up-right' ? 'active' : ''}" on:click={() => handleDirection('up-right')}>↗</button>
      <button class="dir-btn {manualDirection === 'left' ? 'active' : ''}" on:click={() => handleDirection('left')}>←</button>
      <div class="placeholder"></div>
      <button class="dir-btn {manualDirection === 'right' ? 'active' : ''}" on:click={() => handleDirection('right')}>→</button>
      <button class="dir-btn {manualDirection === 'down-left' ? 'active' : ''}" on:click={() => handleDirection('down-left')}>↙</button>
      <button class="dir-btn {manualDirection === 'down' ? 'active' : ''}" on:click={() => handleDirection('down')}>↓</button>
      <button class="dir-btn {manualDirection === 'down-right' ? 'active' : ''}" on:click={() => handleDirection('down-right')}>↘</button>
    </div>
    <div class="distance-btns">
        <div class="distance-row">
            <button class="dist-btn {manualDistance === 1 ? 'active' : ''}" on:click={() => handleDistance(1)}>1</button>
            <button class="dist-btn {manualDistance === 2 ? 'active' : ''}" on:click={() => handleDistance(2)}>2</button>
            <button class="dist-btn {manualDistance === 3 ? 'active' : ''}" on:click={() => handleDistance(3)}>3</button>
        </div>
    </div>
  </div>
</div>

<style>
  .test-mode-widget {
    border: 1px solid var(--border-color, #555);
    padding: 1rem;
    border-radius: 8px;
    background: var(--background-color, #2a2a2a);
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    width: 280px;
  }
  .control-group {
    margin-bottom: 1rem;
  }
  .btn-group {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }
  button {
    padding: 0.5rem 1rem;
    border-radius: 4px;
    border: 1px solid #777;
    background: #444;
    color: white;
    cursor: pointer;
  }
  button.active {
    background: #ff9800;
    border-color: #ff9800;
  }
  .directions-3x3 {
    display: grid;
    grid-template-columns: repeat(3, 50px);
    grid-template-rows: repeat(3, 50px);
    gap: 10px;
    margin-top: 0.5rem;
    justify-content: center;
  }
  .dir-btn {
    width: 50px;
    height: 50px;
    font-size: 1.5em;
  }
  .distance-btns {
      margin-top: 0.5rem;
  }
  .distance-row {
      display: flex;
      gap: 10px;
      justify-content: center;
  }
  .dist-btn {
      width: 40px;
      height: 40px;
      font-size: 1.2em;
  }
</style>