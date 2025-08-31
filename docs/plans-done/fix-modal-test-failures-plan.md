# Plan: Fix Modal Test Failures

**Status:** In Progress

## 1. Problem Analysis

After refactoring the game mode logic, several Playwright tests are failing. The common theme is that modal windows for "Opponent Trapped" and "Player No Moves" are not appearing as expected.

This is likely due to the change from directly calling `gameEventBus.dispatch('ShowModal', ...)` within the game modes to dispatching a more abstract `ShowNoMovesModal` event. The UI layer is probably not yet subscribed to this new event.

## 2. Plan of Action

### Step 1: Fix Syntax Errors

- [ ] Correct the syntax error in `src/lib/services/gameModeService.ts`.
- [ ] Correct the syntax error in `src/lib/gameModes/LocalGameMode.ts`.

### Step 2: Create a Centralized Modal Manager

- [ ] Create a new Svelte component, `ModalManager.svelte`, that will be responsible for listening to all modal-related events on the `gameEventBus` and displaying the appropriate modal.
- [ ] This component will subscribe to `ShowNoMovesModal` and other potential future modal events.

### Step 3: Integrate `ModalManager` into the UI

- [ ] Add the `ModalManager` to the main layout file (likely `src/routes/+layout.svelte` or a similar top-level component) to ensure it's always active.

### Step 4: Run Tests

- [ ] Run the Playwright tests again to confirm that the fixes have resolved the issues.