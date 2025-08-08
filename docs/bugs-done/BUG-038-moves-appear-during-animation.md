---
id: BUG-038
title: New available moves appear during the computer's move animation
status: pending
---

### Description

After the player makes a move, the computer's counter-move is animated on the board. During this animation, the new set of available moves (for the player's next turn) appears before the queen piece has finished moving to its new square.

### Steps to Reproduce

1.  Start a game.
2.  Make a move.
3.  Observe the board closely as the computer makes its move.

### Actual Result

The queen piece starts animating to its new position. While it is still in transit, the dots indicating the next set of available moves appear on the board.

### Expected Result

The queen piece should complete its animation to the new square. Only after the animation is finished should the new set of available move dots appear. 