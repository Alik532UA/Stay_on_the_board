# Acceptance Criteria for Reconnection Modal Updates

## 1. Data Test IDs
- [x] All interactive elements and containers in the Reconnection Modal must have unique `data-testid` attributes.
  - `reconnection-modal-content`
  - `reconnection-title`
  - `reconnection-players-list`
  - `reconnection-player-{pd}`
  - `reconnection-timer`
  - `reconnection-loader`
  - `reconnection-actions`
  - `reconnection-kick-btn`
  - `reconnection-leave-btn`

## 2. "Continue Waiting" Button
- [x] The "Continue Waiting" button must be removed from the UI. It added no value as waiting continues automatically.

## 3. "Leave Game" Button
- [x] The "Leave Game" button (`leave-btn`) must be ALWAYS available (enabled), regardless of the countdown timer.
- [x] Only the "Kick Player" button (`kick-btn`) should respect the cooldown timer.

## 4. Timer Display
- [x] The timer must display numeric values ONLY (e.g., "15"), without the "s" suffix.
- [x] When the timer reaches 0, the digit must disappear entirely from the interface.
