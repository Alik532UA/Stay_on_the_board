---
id: BUG-039
title: Old available moves fade out on game reset instead of disappearing instantly
status: open
---

### Description

When starting a new game by clicking "Play Again", the available move dots from the previous game don't disappear instantly. Instead, they perform a fade-out animation, which overlaps with the appearance of the new queen, creating a visually incorrect sequence.

### Steps to Reproduce

1.  Finish a game to trigger the "Game Over!" modal.
2.  Click the "Грати ще раз" button.

### Actual Result

1.  The old "Available Moves" are visible.
2.  The old "Available Moves" slowly fade out.
3.  While they are fading, the new queen appears.
4.  The new "Available Moves" appear.

### Expected Result

1.  The board is instantly empty (no queen, no move dots).
2.  The new queen smoothly appears.
3.  After the queen has appeared, the new "Available Moves" fade in. 