<script lang="ts">
    /**
     * @file Сторінка відображення помилок (Error Boundary).
     * @description Показує детальну інформацію про помилку ТІЛЬКИ у dev-режимі.
     * У production показує дружнє повідомлення без технічних деталей.
     *
     * Архітектура:
     * - SSoT: Стан помилки отримуємо з SvelteKit `page` store.
     * - SoC: Логіка копіювання та UI чітко розділені.
     * - Композиція: Компонент самодостатній і не залежить від інших.
     */

    import { page } from "$app/stores";
    import { base } from "$app/paths";
    import { browser } from "$app/environment";

    /** Чи знаходимося ми в режимі розробки */
    const isDev = import.meta.env.DEV;

    /** Стан кнопки копіювання */
    let copyButtonText = "📋 Копіювати";
    let copySuccess = false;

    /**
     * Формує текст помилки для копіювання.
     * Включає статус, повідомлення та стек викликів.
     */
    function getErrorText(): string {
        const status = $page.status;
        const message = $page.error?.message ?? "Невідома помилка";
        const stack = ($page.error as any)?.stack ?? "";
        const url = browser ? window.location.href : "";
        const timestamp = new Date().toISOString();

        return `=== MindStep Error Report ===
Timestamp: ${timestamp}
URL: ${url}
Status: ${status}
Message: ${message}
${stack ? `\nStack:\n${stack}` : ""}
=============================`;
    }

    /**
     * Копіює текст помилки в буфер обміну.
     * Показує візуальний фідбек користувачу.
     */
    async function copyError() {
        try {
            await navigator.clipboard.writeText(getErrorText());
            copyButtonText = "✅ Скопійовано!";
            copySuccess = true;

            // Повертаємо стандартний текст через 2 секунди
            setTimeout(() => {
                copyButtonText = "📋 Копіювати";
                copySuccess = false;
            }, 2000);
        } catch (err) {
            copyButtonText = "❌ Помилка копіювання";
            setTimeout(() => {
                copyButtonText = "📋 Копіювати";
            }, 2000);
        }
    }

    /**
     * Перезавантажує сторінку.
     */
    function reload() {
        if (browser) {
            window.location.reload();
        }
    }
</script>

<div class="error-page" data-testid="error-page">
    <div class="error-container">
        <!-- Заголовок з емодзі -->
        <div class="error-header">
            <span class="error-emoji">💥</span>
            <h1>Упс! Щось пішло не так</h1>
        </div>

        <!-- Статус код -->
        <div class="error-status">
            <span class="status-code">{$page.status}</span>
        </div>

        <!-- Коротке повідомлення (завжди показуємо) -->
        <p class="error-message-short">
            {#if $page.status === 404}
                Сторінку не знайдено
            {:else}
                Сталася непередбачена помилка
            {/if}
        </p>

        <!-- Детальна інформація (ТІЛЬКИ в dev-режимі) -->
        {#if isDev}
            <div class="dev-section" data-testid="dev-error-section">
                <div class="dev-badge">🛠️ DEV MODE</div>

                <!-- Повідомлення помилки -->
                <div class="error-details">
                    <h3>Повідомлення:</h3>
                    <pre class="error-message">{$page.error?.message ??
                            "Немає повідомлення"}</pre>
                </div>

                <!-- Стек викликів -->
                {#if ($page.error as any)?.stack}
                    <div class="error-details">
                        <h3>Стек викликів:</h3>
                        <pre class="error-stack">{($page.error as any)
                                .stack}</pre>
                    </div>
                {/if}

                <!-- Кнопка копіювання -->
                <button
                    class="copy-btn"
                    class:success={copySuccess}
                    on:click={copyError}
                    data-testid="copy-error-btn"
                >
                    {copyButtonText}
                </button>
            </div>
        {/if}

        <!-- Кнопки навігації (завжди показуємо) -->
        <div class="action-buttons">
            <button class="action-btn secondary" on:click={reload}>
                🔄 Оновити сторінку
            </button>
            <a href="{base}/" class="action-btn primary"> 🏠 На головну </a>
        </div>
    </div>
</div>

<style>
    .error-page {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
        background: var(--bg-primary, #1a1a2e);
        color: var(--text-primary, #ffffff);
        font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
    }

    .error-container {
        max-width: 800px;
        width: 100%;
        background: var(--bg-secondary, #16213e);
        border-radius: 16px;
        padding: 2rem;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        text-align: center;
    }

    .error-header {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1rem;
    }

    .error-emoji {
        font-size: 4rem;
        animation: shake 0.5s ease-in-out;
    }

    @keyframes shake {
        0%,
        100% {
            transform: translateX(0);
        }
        25% {
            transform: translateX(-5px);
        }
        75% {
            transform: translateX(5px);
        }
    }

    h1 {
        margin: 0;
        font-size: 1.8rem;
        color: var(--text-primary, #ffffff);
    }

    .error-status {
        margin: 1rem 0;
    }

    .status-code {
        display: inline-block;
        font-size: 3rem;
        font-weight: bold;
        padding: 0.5rem 1.5rem;
        background: linear-gradient(135deg, #e74c3c, #c0392b);
        border-radius: 8px;
        color: white;
    }

    .error-message-short {
        font-size: 1.2rem;
        color: var(--text-secondary, #a0a0a0);
        margin-bottom: 2rem;
    }

    /* === Dev Section === */
    .dev-section {
        background: rgba(255, 193, 7, 0.1);
        border: 2px dashed rgba(255, 193, 7, 0.5);
        border-radius: 12px;
        padding: 1.5rem;
        margin: 1.5rem 0;
        text-align: left;
    }

    .dev-badge {
        display: inline-block;
        background: linear-gradient(135deg, #ffc107, #ff9800);
        color: #000;
        padding: 0.3rem 0.8rem;
        border-radius: 20px;
        font-weight: bold;
        font-size: 0.8rem;
        margin-bottom: 1rem;
    }

    .error-details {
        margin-bottom: 1rem;
    }

    .error-details h3 {
        margin: 0 0 0.5rem 0;
        font-size: 0.9rem;
        color: var(--text-secondary, #a0a0a0);
    }

    .error-message,
    .error-stack {
        background: rgba(0, 0, 0, 0.3);
        padding: 1rem;
        border-radius: 8px;
        overflow-x: auto;
        font-family: "Consolas", "Monaco", monospace;
        font-size: 0.85rem;
        line-height: 1.5;
        white-space: pre-wrap;
        word-break: break-word;
        margin: 0;
        color: #f8f8f2;
    }

    .error-stack {
        max-height: 300px;
        overflow-y: auto;
    }

    .copy-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.8rem 1.5rem;
        background: linear-gradient(135deg, #3498db, #2980b9);
        border: none;
        border-radius: 8px;
        color: white;
        font-size: 1rem;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.3s ease;
        margin-top: 1rem;
    }

    .copy-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(52, 152, 219, 0.4);
    }

    .copy-btn.success {
        background: linear-gradient(135deg, #27ae60, #2ecc71);
    }

    /* === Action Buttons === */
    .action-buttons {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        justify-content: center;
        margin-top: 1.5rem;
    }

    .action-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 1rem 2rem;
        border-radius: 12px;
        font-size: 1rem;
        font-weight: bold;
        text-decoration: none;
        cursor: pointer;
        transition: all 0.3s ease;
        border: none;
    }

    .action-btn.primary {
        background: linear-gradient(
            135deg,
            var(--accent-primary, #9b59b6),
            var(--accent-secondary, #8e44ad)
        );
        color: white;
    }

    .action-btn.secondary {
        background: var(--bg-tertiary, #2d3748);
        color: var(--text-primary, #ffffff);
    }

    .action-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    /* === Responsive === */
    @media (max-width: 600px) {
        .error-container {
            padding: 1.5rem;
        }

        h1 {
            font-size: 1.4rem;
        }

        .status-code {
            font-size: 2.5rem;
        }

        .action-buttons {
            flex-direction: column;
        }

        .action-btn {
            width: 100%;
            justify-content: center;
        }
    }
</style>
