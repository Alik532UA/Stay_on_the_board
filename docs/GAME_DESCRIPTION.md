# Stay on the Board: Complete Game Guide

## 1. Core Concept

**"Stay on the Board"** is a strategy game where the primary objective is to keep a shared game piece on the board for as long as possible, avoiding moving it off the board or onto blocked cells.

## 2. Basic Rules

### Starting Conditions
1.  **Initial Position**: A single piece (♛) is placed randomly on the board.
2.  **Turns**: Players take turns moving the *same* piece.
3.  **Movement**: A player chooses a direction (8 options) and a distance (from 1 to N-1, where N is the board size).
4.  **Winning**: The player who remains on the board the longest wins.

### Losing Conditions
A player loses if they:
-   **Move Off-Board**: Make a move that takes the piece off the board.
-   **Blocked Cell**: Land on a blocked cell (in Blocked Cells mode).
-   **Incorrect "No Moves" Claim**: Press the "No Moves" button when valid moves are still available.

### Winning Conditions
A player wins if:
-   **Correct "No Moves" Claim**: They press the "No Moves" button, and no valid moves are left.
-   **Opponent's Mistake**: The opponent makes an invalid move.

## 3. Movement Mechanics

The piece moves like a queen in chess: any number of cells horizontally, vertically, or diagonally. Unlike a standard queen, this piece can **jump over** blocked cells, but it cannot land on them.

### Directions of Movement
The piece can move in 8 directions, mapped to a numeric keypad layout:
```
7 8 9
4 ♛ 6
1 2 3
```
-   **7**: Up-Left (↖)
-   **8**: Up (↑)
-   **9**: Up-Right (↗)
-   **4**: Left (←)
-   **6**: Right (→)
-   **1**: Down-Left (↙)
-   **2**: Down (↓)
-   **3**: Down-Right (↘)

### Distance of Movement
-   **Minimum**: 1 cell
-   **Maximum**: N-1 cells (where N is the board size). For example, on a 5x5 board, the maximum move distance is 4 cells.

### Move Validity
A move is valid if the new position is:
1.  Within the board's boundaries.
2.  Not on a blocked cell (in Blocked Cells mode).

## 4. Game Modes

### Normal Mode
-   All cells remain available throughout the game.
-   The game ends only when a player moves the piece off the board.
-   Recommended for beginners.

### Blocked Cells Mode
-   The cell from which a move is made becomes blocked and unavailable for future moves.
-   Blocked cells are marked with a red ✗.
-   The game ends if a player moves off-board or onto a blocked cell.
-   Offers a more strategic and challenging experience.

## 5. Scoring System

### Basic Points
-   **+1 to +3 points** are awarded for each successful move, depending on the visibility settings (e.g., playing with the board hidden yields more points).
-   **Bonus points** are awarded for various in-game actions.
-   **Penalty points** are given for "mirror" moves in the Vs. Computer mode.
-   **Final Score** = (Sum of all points and bonuses) - Penalties.

### Bonus Points
-   **Distance Bonus (+1)**: For any move longer than 1 cell.
-   **Board Size Bonus**: A percentage of the base score, calculated as `(board_size * board_size) / 100 * base_score`.
-   **Blocked Mode Bonus (+1)**: For every move made in Blocked Cells mode.
-   **Jump Bonus (+1)**: For each blocked cell jumped over during a move.
-   **"No Moves" Bonus**: Equal to the board size (e.g., +5 points on a 5x5 board) for a correct claim.
-   **Game Finish Bonus**: Equal to the board size for choosing to end the game after a "No Moves" situation.

### Penalty Points
-   **Mirror Move Penalty (-2)**: In Vs. Computer mode, if the computer moves N cells in one direction, and the player immediately moves N or fewer cells in the exact opposite direction, a penalty is applied. This discourages repetitive, back-and-forth moves. This penalty does not apply in Blocked Cells mode.

## 6. "No Moves" Button

### Logic
1.  **Verification**: When a player clicks "No Moves," the system checks if any valid moves exist from the current position.
2.  **Outcome**:
    -   **No Moves Exist**: The player wins.
    -   **Moves Exist**: The player loses for making an incorrect claim.

### Strategic Use
This button should be used when a player believes the piece is trapped. It's a high-risk, high-reward move that can end the game decisively.

## 7. Board Sizes

-   **Minimum**: 2x2
-   **Maximum**: 9x9
-   **Default**: 3x3
-   **Recommended for Balance**: 5x5 offers a good mix of strategy and game length.

## 8. Game Types

### Vs. Computer
-   The player competes against a computer AI.
-   The computer's moves are determined by a random algorithm, making it unpredictable.
-   There is a 1-second delay before the computer makes its move.

### Local Game
-   Two players compete on the same device, taking turns.
-   Player names can be customized.

### Online Game
-   Players compete over the internet.
-   One player hosts a room, and the other joins using a room ID.

## 9. UI and Visual Aids

### Available Moves Display
-   A checkbox in the settings ("Show available moves") toggles the visibility of all possible moves.
-   Available landing cells are marked with a dot (●), helping with strategic planning.

### Center Control Button
-   Displays the currently selected direction and distance.
-   Transforms into a confirmation button once a full move is selected.
-   Shows the computer's last move for player reference.

## 10. Game States and Flow

The game progresses through several states:
1.  **Initial State**: The game is at the main menu.
2.  **Game Mode Selection**: A modal appears to choose between Normal or Blocked Cells mode (for Vs. Computer).
3.  **Piece Placement**: The piece is placed randomly on the board.
4.  **Player Turn**: The player selects a direction and distance.
5.  **Move Execution**: The piece moves to the new position.
6.  **Game End Check**: The system checks for win/loss conditions.
7.  **Computer Turn** (if applicable): The AI selects and executes its move.
8.  **Victory/Defeat State**: A modal appears with the final score and options to start a new game or return to the menu.

## 11. Keyboard Shortcuts

The game supports full keyboard control for accessibility and faster play.

### Movement
-   **NumPad 7, 8, 9, 4, 6, 1, 2, 3** or **Q, W, E, A, D, Z, X, C** for directions.
-   Pressing a direction key repeatedly cycles through distances (1, 2, 3...).

### Actions
-   **Confirm Move**: [NumPad 5], [Enter], or [Spacebar].
-   **"No Moves" Claim**: [NumPad .] or [Backspace].

### Settings
-   **Toggle Block Mode**: [NumPad *] or [B].
-   **Toggle Board Visibility**: [NumPad /] or [H].
-   **Increase/Decrease Board Size**: [NumPad +]/[-] or [=]/[-].

## 12. Technical Details for Developers

### Data Structure
-   `board`: A 2D array representing the game board.
-   `blockedCells`: An array storing the coordinates of blocked cells.
-   `currentPlayer`: Indicates the current player (1 or 2).

### Core Functions
-   `getAllValidMoves()`: Returns all possible moves from the current position.
-   `hasValidMoves()`: Checks if any valid moves exist.
-   `processPlayerMove()`: Handles player input and transitions to the next state.
-   `makeComputerMove()`: Executes the AI's turn.

### Architecture Principles
-   The game board visualization (`game-board` component) is asynchronous and decoupled from the game logic.
-   Game logic is self-contained and does not depend on the DOM or rendering state. This is critical for animations and scalability.