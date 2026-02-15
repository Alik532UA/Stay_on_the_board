// src/lib/types/i18n.ts
import en from '../i18n/en.js';

type Join<K, P> = K extends string | number ?
    P extends string | number ?
    `${K}${"" extends P ? "" : "."}${P}`
    : never : never;

type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, ...0[]];

export type Paths<T, D extends number = 10> = [D] extends [never] ? never : T extends object ?
    { [K in keyof T]-?: K extends string | number ?
        `${K}` | Join<K, Paths<T[K], Prev[D]>>
        : never
    }[keyof T] : ""

export type TranslationKey = Paths<typeof en>;

/**
 * Приклад використання:
 * import { _ } from 'svelte-i18n';
 * import type { TranslationKey } from '$lib/types/i18n';
 * const $t = get(_) as (key: TranslationKey, vars?: object) => string;
 */
