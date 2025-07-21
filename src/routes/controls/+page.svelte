<script>
  import FloatingBackButton from '$lib/components/FloatingBackButton.svelte';
  import { _ } from 'svelte-i18n';
  import { settingsStore } from '$lib/stores/settingsStore.js';
  import { onMount } from 'svelte';

  /** @type {{ action: string, index: number } | null} */
  let listeningFor = null;

  /**
   * @type {{ title: string, actions: string[] }[] }
   */
  const actionGroups = [
    {
      title: 'controlsPage.mainMovement',
      actions: ['up-left', 'up', 'up-right', 'left', 'right', 'down-left', 'down', 'down-right']
    },
    {
      title: 'controlsPage.gameActions',
      actions: ['confirm', 'no-moves']
    },
    {
      title: 'controlsPage.gameSettings',
      actions: ['toggle-block-mode', 'toggle-board', 'increase-board', 'decrease-board', 'toggle-speech']
    },
    {
      title: 'controlsPage.distanceSelection',
      actions: ['distance-1', 'distance-2', 'distance-3', 'distance-4', 'distance-5', 'distance-6', 'distance-7', 'distance-8']
    }
  ];

  /** @type {Record<string, string[]>} */
  $: keybindings = $settingsStore.keybindings;

  /** @type {Set<string>} */
  $: conflicts = (() => {
    /** @type {Record<string, number>} */
    const counts = {};
    /** @type {Set<string>} */
    const conflictKeys = new Set();
    for (const keys of Object.values(keybindings)) {
      for (const key of keys) {
        counts[key] = (counts[key] || 0) + 1;
        if (counts[key] > 1) {
          conflictKeys.add(key);
        }
      }
    }
    return conflictKeys;
  })();

  /**
   * @param {string} action
   * @param {number} [index=-1]
   */
  function listenForKey(action, index = -1) {
    listeningFor = { action, index };
  }

  /**
   * @param {string} action
   * @param {number} index
   */
  function removeKey(action, index) {
    const updatedKeys = [...keybindings[action]];
    updatedKeys.splice(index, 1);
    settingsStore.updateSettings({
      keybindings: {
        ...keybindings,
        [action]: updatedKeys
      }
    });
  }

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    if (listeningFor) {
      event.preventDefault();
      if (event.code === 'Escape') {
        listeningFor = null;
        return;
      }
      const { action, index } = listeningFor;
      const newKeybindings = { ...keybindings };
      const keysForAction = [...(newKeybindings[action] || [])];
      if (index !== -1) {
        keysForAction[index] = event.code;
      } else {
        keysForAction.push(event.code);
      }
      newKeybindings[action] = keysForAction;
      settingsStore.updateSettings({ keybindings: newKeybindings });
      listeningFor = null;
    }
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeydown);
    return () => {
      window.removeEventListener('keydown', handleKeydown);
    };
  });
</script>

<FloatingBackButton />

<div class="controls-container">
  <h1>{$_('controlsPage.title')}</h1>

  {#each actionGroups as group}
    <h2>{$_(group.title)}</h2>
    <div class="key-grid">
      {#each group.actions as action}
        <div class="key-item">
          <span class="action-name">{$_(`controlsPage.actions.${action}`)}</span>
          <div class="key-buttons-container">
            {#each keybindings[action] || [] as key, i}
              <div class="key-button-wrapper">
                <button
                  class="key-button"
                  class:listening={listeningFor?.action === action && listeningFor?.index === i}
                  class:conflict={conflicts.has(key)}
                  on:click={() => listenForKey(action, i)}
                >
                  {listeningFor?.action === action && listeningFor?.index === i ? $_('controlsPage.pressKey') : key || 'N/A'}
                </button>
                <button class="remove-key-btn" title={$_('controlsPage.removeKey')} on:click={() => removeKey(action, i)}>×</button>
              </div>
            {/each}
            {#if (keybindings[action]?.length || 0) < 8}
              <button class="add-key-btn" on:click={() => listenForKey(action, -1)}>+</button>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/each}

  <div class="controls-footer">
    {#if conflicts.size > 0}
      <p class="conflict-warning">{$_('controlsPage.keyConflict')}</p>
    {/if}
    <button class="reset-button" on:click={settingsStore.resetKeybindings}>
      {$_('controlsPage.resetToDefaults')}
    </button>
  </div>
</div>

<style>
  .controls-container {
    max-width: 800px;
    margin: 0 auto;
  }
  h2 {
    margin-top: 2rem;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 0.5rem;
  }
  .key-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  .key-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    background: rgba(0,0,0,0.1);
    border-radius: 8px;
  }
  .action-name {
    font-weight: 500;
    flex-shrink: 0;
    margin-right: 1rem;
  }
  .key-buttons-container {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
    justify-content: flex-end;
  }
  .key-button-wrapper {
    position: relative;
  }
  .key-button {
    min-width: 100px;
    text-align: center;
    padding: 0.5rem 1rem;
    border: 1px solid var(--border-color);
    background: var(--control-bg);
    color: var(--text-primary);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
  }
  .key-button:hover {
    border-color: var(--control-selected);
    color: var(--control-selected);
  }
  .key-button.listening {
    background: var(--control-selected);
    color: var(--control-selected-text);
    font-style: italic;
  }
  .key-button.conflict {
    border-color: var(--error-color);
    box-shadow: 0 0 5px var(--error-color);
  }
  .remove-key-btn {
    position: absolute;
    top: -8px;
    right: -8px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: none;
    background: var(--error-color);
    color: white;
    font-weight: bold;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s;
  }
  .key-button-wrapper:hover .remove-key-btn {
    opacity: 1;
  }
  .add-key-btn {
    width: 36px;
    height: 36px;
    border-radius: 6px;
    border: 1px dashed var(--border-color);
    background: transparent;
    color: var(--text-primary);
    font-size: 1.5em;
    cursor: pointer;
  }
  .controls-footer {
    margin-top: 3rem;
    text-align: center;
  }
  .conflict-warning {
    color: var(--error-color);
    font-weight: bold;
    margin-bottom: 1rem;
  }
  .reset-button {
    padding: 0.75rem 1.5rem;
    background: var(--warning-action-bg);
    color: var(--warning-action-text);
    border: none;
    border-radius: 8px;
    font-weight: bold;
    cursor: pointer;
  }
</style> 