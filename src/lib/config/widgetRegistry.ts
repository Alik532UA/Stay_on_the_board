/**
 * @file Реєстр віджетів.
 * @description Централізоване місце для мапінгу ID віджетів на Svelte компоненти.
 * Це дозволяє GamePageLayout бути агностичним до конкретних віджетів.
 */

import { WIDGETS } from '$lib/stores/layoutStore';

// Імпорт компонентів віджетів
import TopRowWidget from '$lib/components/widgets/TopRowWidget.svelte';
import ScorePanelWidget from '$lib/components/widgets/ScorePanelWidget.svelte';
import BoardWrapperWidget from '$lib/components/widgets/BoardWrapperWidget.svelte';
import ControlsPanelWidget from '$lib/components/widgets/ControlsPanelWidget.svelte';
import SettingsExpanderWidget from '$lib/components/widgets/SettingsExpanderWidget.svelte';
import GameInfoWidget from '$lib/components/widgets/GameInfoWidget.svelte';
import PlayerTurnIndicator from '$lib/components/widgets/PlayerTurnIndicator.svelte';
import TimerWidget from '$lib/components/widgets/TimerWidget.svelte';
import GameModeWidget from '$lib/components/widgets/GameModeWidget.svelte';

// Тут можна буде додати нові віджети для Online режиму (наприклад, ChatWidget)
// import OnlineChatWidget from '$lib/components/widgets/OnlineChatWidget.svelte';

export const widgetRegistry: Record<string, any> = {
    [WIDGETS.TOP_ROW]: TopRowWidget,
    [WIDGETS.SCORE_PANEL]: ScorePanelWidget,
    [WIDGETS.BOARD_WRAPPER]: BoardWrapperWidget,
    [WIDGETS.CONTROLS_PANEL]: ControlsPanelWidget,
    [WIDGETS.SETTINGS_EXPANDER]: SettingsExpanderWidget,
    [WIDGETS.GAME_INFO]: GameInfoWidget,
    [WIDGETS.PLAYER_TURN_INDICATOR]: PlayerTurnIndicator,
    [WIDGETS.TIMER]: TimerWidget,
    [WIDGETS.GAME_MODE]: GameModeWidget,
};