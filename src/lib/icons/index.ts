import IconPiece from './IconPiece.svelte';
import IconHome from './IconHome.svelte';
import IconClearCache from './IconClearCache.svelte';
import IconConfirm from './IconConfirm.svelte';
import IconNoMoves from './IconNoMoves.svelte';
import IconTheme from './IconTheme.svelte';
import IconLanguageGlobe from './IconLanguageGlobe.svelte';
import IconDonate from './IconDonate.svelte';
import IconVoiceSettings from './IconVoiceSettings.svelte';
import IconInfo from './IconInfo.svelte';
import IconReset from './IconReset.svelte';
import IconGameMode from './IconGameMode.svelte';
import IconFixed from './IconFixed.svelte';
import IconEditing from './IconEditing.svelte';
import IconBoxingGlove from './IconBoxingGlove.svelte';
import IconHamburgerMenu from './IconHamburgerMenu.svelte';
import IconCopy from './IconCopy.svelte';
import IconTrophyBronze from './IconTrophyBronze.svelte';
import IconStopwatchGold from './IconStopwatchGold.svelte';
import IconHandshake from './IconHandshake.svelte';
import IconLock from './IconLock.svelte';
import IconArrowUp from './IconArrowUp.svelte';
import IconArrowDown from './IconArrowDown.svelte';
import IconPlus from './IconPlus.svelte';
import IconMicrophone from './IconMicrophone.svelte'; // Додано

export const icons = {
    'piece': IconPiece,
    'home': IconHome,
    'clear-cache': IconClearCache,
    'confirm': IconConfirm,
    'no-moves': IconNoMoves,
    'theme': IconTheme,
    'language-globe': IconLanguageGlobe,
    'donate': IconDonate,
    'voice-settings': IconVoiceSettings,
    'info': IconInfo,
    'reset': IconReset,
    'game-mode': IconGameMode,
    'fixed': IconFixed,
    'editing': IconEditing,
    'boxing-glove-pictogram-1': IconBoxingGlove,
    'hamburger-menu': IconHamburgerMenu,
    'copy': IconCopy,
    'trophy_bronze': IconTrophyBronze,
    'stopwatch_gold': IconStopwatchGold,
    'handshake': IconHandshake,
    'lock': IconLock,
    'arrow-up': IconArrowUp,
    'arrow-down': IconArrowDown,
    'plus': IconPlus,
    'microphone': IconMicrophone // Додано
} as const;

export type IconName = keyof typeof icons;