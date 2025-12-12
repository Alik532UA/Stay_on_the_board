<script lang="ts">
  import { _ } from 'svelte-i18n';
  import { gameSettingsStore, type KeybindingAction } from '$lib/stores/gameSettingsStore';
  import { onMount } from 'svelte';
  import { customTooltip } from '$lib/actions/customTooltip.js';
  import { userActionService } from '$lib/services/userActionService';
  import { isModalOpen } from '$lib/stores/isModalOpenStore';
  import { get } from 'svelte/store';

  let listeningFor: { action: KeybindingAction; index: number } | null = null;

  const actionGroups: { title: string; actions: KeybindingAction[] }[] = [
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
      actions: ['toggle-block-mode', 'toggle-board', 'increase-board', 'decrease-board', 'toggle-speech', 'auto-hide-board']
    },
    {
      title: 'controlsPage.distanceSelection',
      actions: ['distance-1', 'distance-2', 'distance-3', 'distance-4', 'distance-5', 'distance-6', 'distance-7', 'distance-8']
    },
    {
      title: 'controlsPage.navigation',
      actions: ['main-menu']
    },
    {
      title: 'controlsPage.general',
      actions: ['show-help', 'toggle-theme', 'toggle-language']
    }
  ];

  $: keybindings = $gameSettingsStore.keybindings;

  $: conflicts = (() => {
    const counts: Record<string, number> = {};
    const conflictKeys = new Set<string>();
    // Явне приведення типів для Object.values
    const allKeys = Object.values(keybindings) as string[][];
    for (const keys of allKeys) {
      for (const key of keys) {
        counts[key] = (counts[key] || 0) + 1;
        if (counts[key] > 1) {
          conflictKeys.add(key);
        }
      }
    }
    return conflictKeys;
  })();

  function listenForKey(action: KeybindingAction, index: number = -1) {
    listeningFor = { action, index };
  }

  function removeKey(action: KeybindingAction, index: number) {
    const newKeybindings = { ...get(gameSettingsStore).keybindings };
    const updatedKeys = [...(newKeybindings[action] || [])];
    updatedKeys.splice(index, 1);
    newKeybindings[action] = updatedKeys;
    gameSettingsStore.updateSettings({ keybindings: newKeybindings });
  }

  function handleKeydown(event: KeyboardEvent) {
    if (get(isModalOpen)) return;
    if (listeningFor) {
      event.preventDefault();
      if (event.code === 'Escape') {
        listeningFor = null;
        return;
      }
      const { action, index } = listeningFor;
      const newKeybindings = { ...get(gameSettingsStore).keybindings };
      const keysForAction = [...(newKeybindings[action] || [])];
      if (index !== -1) {
        keysForAction[index] = event.code;
      } else {
        keysForAction.push(event.code);
      }
      newKeybindings[action] = keysForAction;
      gameSettingsStore.updateSettings({ keybindings: newKeybindings });
      listeningFor = null;
    }
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeydown);
    return () => {
      window.removeEventListener('keydown', handleKeydown);
    };
  });

  function formatKeyCode(code: string) {
    if (!code) return 'N/A';
    return code
      .replace(/^Key/, '')
      .replace(/^Digit/, '')
      .replace(/^Numpad/, 'NumPad ')
      .replace('Decimal', '.')
      .replace('Multiply', '*')
      .replace('Divide', '/')
      .replace('Add', '+')
      .replace('Subtract', '-');
  }
</script>

<div class="hotkeys-tab">
  {#each actionGroups as group}
    <h3 class="group-title">{$_(group.title)}</h3>
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
                  {listeningFor?.action === action && listeningFor?.index === i
                    ? $_('controlsPage.pressKey')
                    : formatKeyCode(key)}
                </button>
                <button class="remove-key-btn" use:customTooltip={$_('controlsPage.removeKey')} on:click={() => removeKey(action, i)}>×</button>
              </div>
            {/each}
            {#if (keybindings[action]?.length || 0) < 8}
              {#if listeningFor?.action === action && listeningFor?.index === -1}
                <span class="press-key-hint">{$_('controlsPage.pressKey') || 'Натисніть клавішу'}</span>
              {:else}
                <button class="add-key-btn" on:click={() => listenForKey(action, -1)}>+</button>
              {/if}
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
    <button class="reset-button" on:click={userActionService.resetKeybindings}>
      {$_('controlsPage.resetToDefaults')}
    </button>
  </div>
</div>

<style>
  .hotkeys-tab {
    width: 100%;
    padding-bottom: 40px;
  }
  
  .group-title {
    margin-top: 2rem;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 0.5rem;
    color: var(--text-primary);
    font-size: 1.2em;
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
    flex-wrap: wrap;
    gap: 10px;
  }
  
  .action-name {
    font-weight: 500;
    flex-shrink: 0;
    margin-right: 1rem;
    color: var(--text-primary);
  }
  
  .key-buttons-container {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
    justify-content: flex-end;
    flex-grow: 1;
  }
  
  .key-button-wrapper {
    position: relative;
  }
  
  .key-button {
    min-width: 50px;
    text-align: center;
    padding: 0.5rem 1rem;
    border: 1px solid var(--border-color);
    background: var(--control-bg);
    color: var(--text-primary);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    font-family: monospace;
    font-size: 0.9em;
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
    font-size: 14px;
    line-height: 1;
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
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .add-key-btn:hover {
    border-color: var(--control-selected);
    color: var(--control-selected);
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
  
  .press-key-hint {
    display: inline-block;
    min-width: 120px;
    padding: 0.6rem 1.2rem;
    background: linear-gradient(90deg, #ffe082 0%, #ffd54f 100%);
    color: #b26a00;
    border: 2px solid #ffb300;
    border-radius: 8px;
    text-align: center;
    font-weight: 600;
    font-size: 1.08em;
    box-shadow: 0 2px 12px 0 rgba(255, 193, 7, 0.18);
    animation: pressKeyPulse 1.2s infinite alternate, fadeIn 0.2s;
  }
  
  @keyframes pressKeyPulse {
    from { box-shadow: 0 2px 12px 0 rgba(255, 193, 7, 0.18); }
    to { box-shadow: 0 4px 24px 0 rgba(255, 193, 7, 0.38); }
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
</style>