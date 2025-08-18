/**
 * Централізований сервіс для управління станом гри.
 * Єдине місце для всіх мутацій стану з валідацією та логуванням.
 */

import { get } from 'svelte/store';
import { playerInputStore } from '../stores/playerInputStore.js';
import { animationStore } from '../stores/animationStore.js';
import { logService } from './logService.js';
import { gameState } from '../stores/gameState.js';
import { validatePlayerMove } from './gameLogicService.js';
import { validateScoreUpdate } from './scoreService.js';
