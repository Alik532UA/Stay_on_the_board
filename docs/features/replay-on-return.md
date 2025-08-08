---
type: feature-documentation
title: Replay on Return to Game
status: done
---

### Feature Description

This document describes a visual feature where, upon returning to an in-progress game, the UI animates all moves from the beginning of the session up to the current state. This creates a "replay" effect for the user.

By default, this feature is **disabled** in favor of instantly showing the current game state.

### How It Works

The animation is handled by the `src/lib/components/widgets/BoardWrapperWidget.svelte` component. It maintains a local `lastProcessedMoveIndex` which tracks how many moves from the `gameState.moveQueue` have been animated.

When the component is unmounted (e.g., by navigating to the main menu) and then re-mounted, this local index is reset to `0`. The animation logic in the `$effect` hook then sees the entire `moveQueue` as "new" and processes it from the beginning, causing the replay effect.

### How to Re-enable This Feature

To restore the "replay on return" behavior, you need to modify `src/lib/components/widgets/BoardWrapperWidget.svelte`.

1.  Find the `onMount` lifecycle function within the `<script>` block.
2.  Comment out or delete the entire `onMount` block.

**Code to comment out:**

```javascript
onMount(() => {
    // On mount, immediately sync the visual state to the logical state
    const currentState = get(gameState);
    visualRow = currentState.playerRow;
    visualCol = currentState.playerCol;
    
    // And tell the animation processor that all moves in the queue are "old"
    lastProcessedMoveIndex = currentState.moveQueue.length;
});
```

By removing this block, the `lastProcessedMoveIndex` will remain `0` on component mount, and the animation logic will replay all moves from the queue. 