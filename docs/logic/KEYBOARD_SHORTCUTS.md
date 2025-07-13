# Keyboard Shortcuts

## Game Controls

### Direction Selection (NumPad)
- **7** (↖): Select up-left direction
- **8** (↑): Select up direction  
- **9** (↗): Select up-right direction
- **4** (←): Select left direction
- **6** (→): Select right direction
- **1** (↙): Select down-left direction
- **2** (↓): Select down direction
- **3** (↘): Select down-right direction

**Behavior:**
- **First press**: Selects direction and automatically selects distance 1
- **Same direction again**: Increments distance by 1 (up to boardSize - 1)
- **At maximum distance**: Resets distance to 1 on next press
- **Different direction**: Selects new direction and resets distance to 1 only if not manually selected

**Distance Limits:**
- **3x3 board**: Maximum distance = 2 (cycles: 1 → 2 → 1)
- **4x4 board**: Maximum distance = 3 (cycles: 1 → 2 → 3 → 1)
- **5x5 board**: Maximum distance = 4 (cycles: 1 → 2 → 3 → 4 → 1)

### Distance Selection
- **1-9**: Select specific distance (limited by boardSize - 1)
- **Space**: Confirm move (when both direction and distance are selected)
- **Enter**: Confirm move (alternative to Space)

**Manual Distance Behavior:**
- **Preservation**: Manually selected distances are preserved when changing direction
- **Automatic Reset**: Only automatically selected distances are reset when changing direction

### Move Confirmation
- **Space**: Confirm the selected move
- **Enter**: Confirm the selected move
- **NumPad 5**: Confirm the selected move (center button)
- **Click on center-info**: Confirm the selected move (when both direction and distance are selected)

### Center Info Element
The center-info element provides visual feedback about the current game state:

#### Visual States
1. **Empty State**: No content, no border, transparent background - when no direction or distance is selected
2. **Computer Move Display**: Shows last computer move (e.g., "→2") with orange background, no border
3. **Direction Only**: Shows only direction arrow (e.g., "→", "↑") with no border
4. **Distance Only**: Shows only distance number (e.g., "2", "3") with no border  
5. **Confirmable Move**: Shows direction + distance (e.g., "→2") with border and clickable

#### Interaction
- **Clickable**: Only when both direction and distance are selected (confirmable state)
- **Visual Feedback**: Border and animation indicate when move can be confirmed
- **Computer Move**: Displays last computer move until player starts selecting their move

### Game Actions
- **Backspace**: Declare "no moves available"
- **Escape**: Cancel current selection
- **H**: Show help/information

## Navigation

### Menu Navigation
- **Escape**: Return to main menu
- **Tab**: Navigate between menu items
- **Enter**: Select menu item

### Settings
- **T**: Toggle theme (light/dark)
- **L**: Toggle language
- **S**: Open settings

## Accessibility

### Screen Reader Support
- All interactive elements have proper ARIA labels
- Keyboard navigation is fully supported
- Focus indicators are clearly visible

### Visual Feedback
- Selected elements are highlighted
- Hover effects provide visual feedback
- Disabled elements are visually distinct

## Mobile Support

### Touch Controls
- Tap direction buttons to select
- Tap distance buttons to select
- Tap center button to confirm move
- Swipe gestures are not currently supported

### Responsive Design
- Controls adapt to screen size
- Touch targets are appropriately sized
- Layout adjusts for different orientations

## Tips

1. **Quick Moves**: Use the same direction key multiple times to quickly cycle through distances
2. **Visual Feedback**: Watch the center button to see your current selection
3. **Keyboard Efficiency**: Use NumPad for faster direction selection
4. **Confirmation**: Always confirm your move with Space/Enter after selecting both direction and distance
5. **Distance Cycling**: On 3x3 boards, pressing the same direction 3 times cycles: 1 → 2 → 1
6. **Manual Distance**: If you manually select a distance, it will be preserved when changing direction
7. **Automatic Distance**: Automatically selected distances reset to 1 when changing direction 