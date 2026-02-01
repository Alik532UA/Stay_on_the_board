// src/lib/icons/flags/index.ts
import FlagUk from './FlagUk.svelte';
import FlagEn from './FlagEn.svelte';
import FlagCrh from './FlagCrh.svelte';
import FlagNl from './FlagNl.svelte';
import type { ComponentType, SvelteComponent } from 'svelte';

export const flags: Record<string, ComponentType<SvelteComponent>> = {
    'uk': FlagUk,
    'en': FlagEn,
    'crh': FlagCrh,
    'nl': FlagNl,
};

export type FlagCode = keyof typeof flags;

export { FlagUk, FlagEn, FlagCrh, FlagNl };
