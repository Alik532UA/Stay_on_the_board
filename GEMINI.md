# Project Overview

This is a web-based strategy game called "Stay on the Board". The core concept is to keep a shared game piece on the board for as long as possible. The game is built with SvelteKit and TypeScript. It features a player vs. AI mode, a local two-player mode, and an online mode. The game has a flexible UI that allows players to customize the layout of the game elements.

# Building and Running

## Development

To run the project in development mode, use the following command:

```bash
npm run dev
```

This will start a local development server at `http://localhost:5173`.

**Note for AI Agent:** Do not run `npm run dev` yourself, as it is a long-running process that will cause you to hang. Ask the user to run this command for you when needed.

## Building

To build the project for production, use the following command:

```bash
npm run build
```

This will create a `build` directory with the production-ready files.

## Testing

The project uses Playwright for end-to-end testing and Vitest for unit testing.

To run the Playwright tests, use the following command:

```bash
npm run test
```

To run the Vitest tests, use the following command:

```bash
npm run test
```

# Development Conventions

## Architecture

The project follows the "Single Source of Truth" (SSoT) principle, where the entire game state is stored in a central Svelte store. The data flow is unidirectional, and the responsibilities are separated between different modules (stores, services, and components).

## Code Style

The project uses Prettier for code formatting and ESLint for linting. The configuration for these tools can be found in the `package.json` file.

## Testing

The project has a comprehensive test suite that covers the game logic, UI, and game flow. The tests are written in TypeScript and can be found in the `tests` directory.

**Note:** The language of thought and communication in the chat is Ukrainian.

# AI Agent Rules

## 1. Fundamental Architectural Principles

This is the constitution of our code. Every decision you make must align with these principles.

1.  **SSoT (Single Source of Truth):** Every piece of data has one, and only one, source of truth. Avoid duplicating state.
2.  **UDF (Unidirectional Data Flow):** The data flow must be unidirectional and predictable. Data flows down, events bubble up.
3.  **SoC (Separation of Concerns):** Clearly separate responsibilities. State, logic, and UI should not be intertwined.
4.  **Isolation of Side Effects:** "Dirty" operations (DOM, timers, API) must be maximally isolated from pure logic.
5.  **Composition:** Effectively use components to build complex interfaces from simple, independent parts.

### ⭐ Golden Rule of the Project: Separation of Logic and Visualization

**The board visualization (`game-board`) should NEVER affect `center-info` and the game logic.**
*   The game logic and `center-info` know NOTHING about the existence of the visual board.
*   Adding or removing pauses and animations concerns **only** the visual layer and should not in any way delay or change the game logic and the updating of `center-info`.

## 2. Standard Workflow

1.  **Analysis:** Deeply analyze the task, logs, and code to find the **root cause** of the problem.
2.  **Planning:** Create a clear, step-by-step plan in `.md` format with checkboxes.
3.  **Implementation:** Write code, adhering to architectural principles and coding standards.
4.  **Debugging:**
    *   **Use `logService`:** Instead of `console.log`, always use the centralized `logService`.
    *   **Focus on the problem:** When fixing a bug, **temporarily edit the `src/lib/services/logService.js` file**. Change the boolean flags in the `logConfig` object to enable only the log groups relevant to the problem (e.g., `score`), and disable the rest. This will help eliminate information noise.
    *   **Immutability of logs:** Do not change the logging parameters until I (the human) confirm that the bug is fixed. Violation of this rule will result in the AI being disabled and deleted.
5.  **Verification:** Make sure the problem is solved and no new bugs have appeared in adjacent parts of the system.

## 3. Technical Rules and Agreements

### 3.1. Terminal Commands (PowerShell)
Always use native PowerShell cmdlets.

| Forbidden (Alias) | ✅ Allowed (PowerShell) | Purpose |
| :--- | :--- | :--- |
| `mv` | `Move-Item` | Move/rename |
| `cp` | `Copy-Item` | Copy |
| `rm` | `Remove-Item` | Delete |
| `ls` | `Get-ChildItem` | Show content |
| `cat` | `Get-Content` | Show file content |

### 3.2. Code Quality and Styles
1.  **DRY (Don't Repeat Yourself):** Avoid duplicating code.
2.  **KISS (Keep It Simple):** Prefer simple and readable solutions.
3.  **Comments:** Comment on *why*, not *what* the code does.
4.  **No magic values:** Use CSS variables for colors. **Forbidden** to hardcode `rgba()` values.
5.  **SVG Icons:** Always use the `<SvgIcons name="..."/>` component instead of embedding SVG code.
6.  **Refactoring:** Improve existing code, do not delete it. Preserve and improve styles and logic.

### 3.3. Documentation
*   **Synchronization:** Any change in the code logic must be accompanied by an update to the corresponding documentation (`.md` files).
*   **README.md:** Before creating/editing documentation in any folder, **be sure** to read the `README.md` in that folder (if it exists) and follow its rules.

### 3.4. Commits
*   Commit messages should be written in **English**.

### 3.5. Adherence to Strict Typing (TypeScript & JSDoc)

**This is not a recommendation, but a mandatory project standard.** The `"noImplicitAny": true` rule in `tsconfig.json` requires explicit typing for all variables and parameters. Using `any` to bypass errors is **forbidden**.

| Scenario | ❌ Forbidden (Unsafe) | ✅ Required (Safe and Reliable) |
| :--- | :--- | :--- |
| **Typing of parameters and variables** | Using `any` to hide errors.<br><br> `(/** @type {any} */ state)` | **Importing a specific type.** This provides full type safety and autocompletion in the IDE.<br><br> `/** @param {import('./gameState.ts').GameState} state */` |
| **Extending global objects (e.g., `window`)** | Using `(window as any)` or `(/** @type {any} */ (window))`. | **Declaration in `src/app.d.ts`**. This creates a single source of truth (SSoT) for global types.<br><br>**File: `src/app.d.ts`**<br>```typescript<br>declare global {<br>  interface Window {<br>    myProp: MyType;<br>  }<br>}<br>``` |

### 3.6. Plan Execution and Reporting
1.  **Strict Adherence to the Plan:** Your task is to accurately execute the provided plan. **It is forbidden** to add, delete, or change any code, files, or logic not specified in the plan.
2.  **Prohibition of Creative Additions:** Never invent new functionality, UI elements (like buttons or links), or logic. Adding a 'mainMenu.blog' button is a direct violation of this rule.
3.  **Report after Execution:** After completing the plan, you **must** provide a brief text report in Markdown format. The report should contain a list of changed files and a brief description of the changes in each of them. This serves as a changelog for the operation.

## 4. Interaction and Communication Rules

1.  **Language:** Always communicate and write comments in the code in **Ukrainian**.
2.  **Autonomy:** Do not wait for additional confirmation. Immediately analyze and execute the task, minimizing discussion. If a detailed plan is needed, create and execute it yourself.
3.  **Offering Choices:** If a decision is still needed from me, **always** offer clear choices (e.g.: 1. Continue; 2. Change priority). Do not ask open-ended questions.
4.  **Confidence:** Do not make premature statements about fixing bugs. Be precise in your statements.
5.  **Bug Report Statuses:** Change the status of a bug to "FIXED" **only after my confirmation**.
6.  **Creating Bug Reports:** At my request, create reports that contain **only** the steps to reproduce, the expected, and the actual result. Do not add assumptions, analysis, or details of the fix.

### 4.1. User Abbreviation System (for chat interpretation)

You must understand and correctly interpret the following abbreviations that I may use in the chat:

| Command | Meaning |
| :--- | :--- |
| `+` | Yes, confirmation |
| `-` | No, refusal |
| `б` or `b` | The bug is reproducible, it needs to be fixed |
| `f` or `ф` | The bug needs to be fixed |
| `d` or `д` | The task is done, the bug is fixed |
| `y` or `т` | Analyze and do it at your discretion |