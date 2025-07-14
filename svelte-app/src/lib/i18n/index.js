import { register } from 'svelte-i18n';
import { browser } from '$app/environment';

register('uk', () => import('./uk.js'));
register('en', () => import('./en.js'));
register('crh', () => import('./crh.js'));
register('nl', () => import('./nl.js'));
// No init() here! 