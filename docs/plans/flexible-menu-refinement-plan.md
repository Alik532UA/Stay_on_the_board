# Flexible Menu Refinement Plan

## Goal
Optimize the `FlexibleMenu` toggle button for touch accessibility while maintaining a minimal visual footprint, and update the menu content/navigation logic to match the new user requirements.

## User Review Required
- **Toggle Visuals:** The visual part of the toggle button will be smaller (height ~24px) but the clickable area will remain large (padding/height ~48px) for easier touch interaction.
- **Menu Items:** The menu will be reconfigured:
    1. Rewards 🏆 -> `/rewards`
    2. Donate 🪙 -> `/supporters`
    3. Game Mode ▶️ -> Open Game Mode Modal
    4. Settings ⚙️ -> `/settings`
    5. Rules 📝 -> `/rules`

## Proposed Changes

### [FlexibleMenu Component]
#### [MODIFY] [FlexibleMenu.svelte](file:///c:/Users/ozapolnov/Documents/code/study/Stay_on_the_board/src/lib/components/ui/FlexibleMenu/FlexibleMenu.svelte)
- Refactor the toggle button structure:
  - Create a wrapper `.toggle-trigger` (the button) serving as the touch target (hitbox).
  - Add an inner `.toggle-visual` div for the visible style (background, glass effect, border radius).
- Styles:
  - `.toggle-trigger`: Transparent, larger height (e.g., 44px/48px), flex center.
  - `.toggle-visual`: Inherit existing styles (bg, backdrop-filter), shorter height (e.g., 20px-24px), full width (60px).
  - Ensure correct positioning relative to the menu panel (flush connection).

### [Demo Page]
#### [MODIFY] [+page.svelte](file:///c:/Users/ozapolnov/Documents/code/study/Stay_on_the_board/src/routes/+page.svelte)
- Import `goto` from `$app/navigation`.
- Import `modalStore` from `$lib/stores/modalStore`.
- Implement `openGameModeModal` function (replicating logic from `MainMenu`).
- Update `menuItems` configuration:
  - **Item 1:** id: `rewards`, icon: `trophy_bronze` (or `trophy`?), label: `Rewards`, action: `goto('/rewards')`.
  - **Item 2:** id: `donate`, icon: `donate`, label: `Donate`, action: `goto('/supporters')`.
  - **Item 3 (Primary):** id: `play`, icon: `arrow-right` (or `play`?), label: `Play`, action: `openGameModeModal`.
  - **Item 4:** id: `settings`, icon: `settings`, label: `Settings`, action: `goto('/settings')`.
  - **Item 5:** id: `rules`, icon: `book` (or `rules`?), label: `Rules`, action: `goto('/rules')`.

## Verification Plan
### Manual Verification
1.  **Toggle Check:**
    - Verify visually that the toggle "tongue" is smaller.
    - Verify that clicking slightly outside the visible part (but within the new larger hitbox) still toggles the menu.
2.  **Navigation Check:**
    - Click "Rewards" -> Verify URL changes to `/rewards`.
    - Click "Donate" -> Verify URL changes to `/supporters`.
    - Click "Settings" -> Verify URL changes to `/settings`.
    - Click "Rules" -> Verify URL changes to `/rules`.
3.  **Modal Check:**
    - Click Center Button -> Verify Game Mode Modal opens.
