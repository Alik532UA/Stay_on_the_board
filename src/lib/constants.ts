// src/lib/constants.ts
import { flags } from '$lib/icons/flags';
import type { ComponentType, SvelteComponent } from 'svelte';

export interface Language {
  code: 'uk' | 'en' | 'crh' | 'nl';
  component: ComponentType<SvelteComponent>;
}

export const languages: Language[] = [
  { code: 'uk', component: flags['uk'] },
  { code: 'en', component: flags['en'] },
  { code: 'crh', component: flags['crh'] },
  { code: 'nl', component: flags['nl'] },
];