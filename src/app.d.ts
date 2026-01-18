// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

/**
 * @file Глобальні типи для SvelteKit додатку.
 * @description SSoT для типів App namespace.
 */
declare global {
	namespace App {
		/**
		 * Розширений інтерфейс помилки.
		 * У dev-режимі включає стек викликів для відладки.
		 */
		interface Error {
			message: string;
			/** Стек викликів (доступний тільки в dev-режимі) */
			stack?: string;
		}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export { };

