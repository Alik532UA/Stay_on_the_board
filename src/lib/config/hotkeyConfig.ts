import type { KeybindingAction } from "$lib/stores/gameSettingsStore";

export const actionGroups: { title: string; actions: KeybindingAction[] }[] = [
    {
        title: "controlsPage.mainMovement",
        actions: [
            "up-left",
            "up",
            "up-right",
            "left",
            "right",
            "down-left",
            "down",
            "down-right",
        ],
    },
    {
        title: "controlsPage.gameActions",
        actions: ["confirm", "no-moves"],
    },
    {
        title: "controlsPage.gameSettings",
        actions: [
            "toggle-block-mode",
            "toggle-board",
            "increase-board",
            "decrease-board",
            "toggle-speech",
            "auto-hide-board",
        ],
    },
    {
        title: "controlsPage.distanceSelection",
        actions: [
            "distance-1",
            "distance-2",
            "distance-3",
            "distance-4",
            "distance-5",
            "distance-6",
            "distance-7",
            "distance-8",
        ],
    },
    {
        title: "controlsPage.navigation",
        actions: ["main-menu"],
    },
    {
        title: "controlsPage.general",
        actions: ["show-help", "toggle-theme", "toggle-language"],
    },
];
