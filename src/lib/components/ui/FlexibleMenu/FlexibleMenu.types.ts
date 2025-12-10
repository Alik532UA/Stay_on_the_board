export interface IMenuItem {
    id: string;
    icon?: string; // Name of the icon for SvgIcons component
    emoji?: string; // Emoji character
    onClick: () => void;
    isActive?: boolean; // Highlight active state
    primary?: boolean; // Explicit flag for the central FAB (optional, as index 2 is default)
}

export type MenuPosition = 'top' | 'bottom';
