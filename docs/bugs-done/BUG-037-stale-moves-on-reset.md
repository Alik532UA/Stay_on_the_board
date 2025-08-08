---
id: BUG-037
title: Stale "Available Moves" are visible when starting a new game
status: pending
---

### Description

When the user clicks "Грати ще раз" (Play Again) from the "Game Over" modal, the UI shows a mix of old and new states, leading to a confusing visual sequence.

### Steps to Reproduce

1.  Finish a game to trigger the "Game Over!" modal.
2.  Click the "Грати ще раз" button.

### Actual Result

The board briefly shows the "Available Moves" from the previous game. Then, the new "Available Moves" for the new game appear. Finally, the queen piece animates into its new starting position.

### Expected Result

The board should first become completely empty (no queen, no available moves). Then, the queen should smoothly appear in its new random position. After the queen has appeared, the new "Available Moves" should fade in. 