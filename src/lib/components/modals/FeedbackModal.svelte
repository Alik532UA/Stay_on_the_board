<script lang="ts">
    import { _ } from "svelte-i18n";
    import {
        feedbackService,
        type FeedbackType,
    } from "$lib/services/feedbackService";
    import { modalStore } from "$lib/stores/modalStore";
    import StyledButton from "$lib/components/ui/StyledButton.svelte";
    import GameModeButton from "$lib/components/game-modes/GameModeButton.svelte";
    import { logService } from "$lib/services/logService";
    import { onMount } from "svelte";

    // Props
    export let initialType: FeedbackType | null = null;

    // Стан компонента
    let selectedType: FeedbackType | null = initialType;
    let isSubmitting = false;

    // Поля форми
    let pageLocation = "";
    let textContent = "";
    let actualResult = "";
    let expectedResult = "";

    onMount(() => {
        // Автозаповнення поточної сторінки
        if (typeof window !== "undefined") {
            pageLocation = window.location.pathname;
        }
        if (initialType) {
            logService.ui(
                `[FeedbackModal] Initialized with type: ${initialType}`,
            );
        }
    });

    function selectType(type: FeedbackType) {
        logService.ui(`[FeedbackModal] Selected type: ${type}`);
        selectedType = type;
    }

    async function handleSubmit() {
        if (isSubmitting) return;

        // Валідація
        if (selectedType === "improvement" && !textContent.trim()) return;
        if (selectedType === "other" && !textContent.trim()) return;
        if (selectedType === "reward_suggestion" && !textContent.trim()) return;
        if (
            selectedType === "bug" &&
            (!actualResult.trim() || !expectedResult.trim())
        )
            return;

        isSubmitting = true;

        try {
            await feedbackService.submitFeedback({
                type: selectedType!,
                page: pageLocation,
                text: textContent,
                actualResult,
                expectedResult,
            });
            modalStore.closeModal();
        } catch (e) {
            // Помилка вже оброблена в сервісі (notification)
            isSubmitting = false;
        }
    }

    function goBack() {
        // Якщо тип був переданий при ініціалізації, кнопка "Назад" закриває модалку
        if (initialType) {
            modalStore.closeModal();
        } else {
            selectedType = null;
            textContent = "";
            actualResult = "";
            expectedResult = "";
        }
    }
</script>

<div class="feedback-modal-container">
    <!-- Заголовок всередині контенту (Варіант 3A) -->
    <h2 class="modal-title-menu">{$_("ui.feedback.title")}</h2>

    {#if !selectedType}
        <!-- Крок 1: Вибір типу (Варіант 1A + 4A) -->
        <div class="menu-list">
            <GameModeButton
                icon="💡"
                text={$_("ui.feedback.typeImprovement")}
                dataTestId="fb-type-improvement"
                on:click={() => selectType("improvement")}
            />
            <GameModeButton
                icon="⚠️"
                text={$_("ui.feedback.typeBug")}
                dataTestId="fb-type-bug"
                on:click={() => selectType("bug")}
            />
            <GameModeButton
                icon="🏆"
                text={$_("ui.feedback.typeReward")}
                dataTestId="fb-type-reward"
                on:click={() => selectType("reward_suggestion")}
            />
            <GameModeButton
                icon="💭"
                text={$_("ui.feedback.typeOther")}
                dataTestId="fb-type-other"
                on:click={() => selectType("other")}
            />
        </div>
    {:else}
        <!-- Крок 2: Форма (Варіант 2A - .glass-input) -->
        <div class="form-container">
            <!-- Спільне поле для Improvement та Bug -->
            {#if selectedType === "improvement" || selectedType === "bug"}
                <div class="form-group">
                    <label for="fb-page">{$_("ui.feedback.pageLabel")}</label>
                    <input
                        id="fb-page"
                        type="text"
                        bind:value={pageLocation}
                        class="glass-input"
                    />
                </div>
            {/if}

            <!-- Поля для Improvement -->
            {#if selectedType === "improvement"}
                <div class="form-group">
                    <label for="fb-text"
                        >{$_("ui.feedback.improvementLabel")} *</label
                    >
                    <textarea
                        id="fb-text"
                        bind:value={textContent}
                        class="glass-input textarea-resize"
                        rows="4"
                    ></textarea>
                </div>
            {/if}

            <!-- Поля для Reward Suggestion -->
            {#if selectedType === "reward_suggestion"}
                <div class="form-group">
                    <label for="fb-reward"
                        >{$_("ui.feedback.rewardLabel")} *</label
                    >
                    <textarea
                        id="fb-reward"
                        bind:value={textContent}
                        class="glass-input textarea-resize"
                        rows="5"
                        placeholder="Наприклад: 'Майстер захисту' - виграти гру, не втративши жодного очка..."
                    ></textarea>
                </div>
            {/if}

            <!-- Поля для Bug -->
            {#if selectedType === "bug"}
                <div class="form-group">
                    <label for="fb-actual"
                        >{$_("ui.feedback.actualResultLabel")} *</label
                    >
                    <textarea
                        id="fb-actual"
                        bind:value={actualResult}
                        class="glass-input textarea-resize"
                        rows="3"
                    ></textarea>
                </div>
                <div class="form-group">
                    <label for="fb-expected"
                        >{$_("ui.feedback.expectedResultLabel")} *</label
                    >
                    <textarea
                        id="fb-expected"
                        bind:value={expectedResult}
                        class="glass-input textarea-resize"
                        rows="3"
                    ></textarea>
                </div>
            {/if}

            <!-- Поля для Other -->
            {#if selectedType === "other"}
                <div class="form-group">
                    <label for="fb-desc"
                        >{$_("ui.feedback.descriptionLabel")} *</label
                    >
                    <textarea
                        id="fb-desc"
                        bind:value={textContent}
                        class="glass-input textarea-resize"
                        rows="5"
                    ></textarea>
                </div>
            {/if}

            <div class="actions-row">
                <StyledButton
                    variant="default"
                    size="large"
                    on:click={goBack}
                    disabled={isSubmitting}
                >
                    ← {$_("ui.goBack")}
                </StyledButton>
                <StyledButton
                    variant="primary"
                    size="large"
                    on:click={handleSubmit}
                    disabled={isSubmitting}
                >
                    {isSubmitting
                        ? $_("common.loading")
                        : $_("ui.feedback.submit")}
                </StyledButton>
            </div>
        </div>
    {/if}
</div>

<style>
    .feedback-modal-container {
        display: flex;
        flex-direction: column;
        gap: 24px;
        width: 100%;
        /* Центрування контенту, аналогічно GameModeModal */
        box-sizing: border-box;
        max-width: 100%;
        margin: 0 auto;
    }

    .modal-title-menu {
        text-align: center;
        font-size: 1.8em;
        font-weight: 800;
        color: #fff;
        margin: 0 0 8px 0;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }

    .menu-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
        width: 100%;
    }

    .form-container {
        display: flex;
        flex-direction: column;
        gap: 20px;
        width: 100%;
    }

    .form-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
        text-align: left;
    }

    label {
        font-size: 0.95em;
        font-weight: 700;
        color: rgba(255, 255, 255, 0.8);
        margin-left: 4px;
    }

    /* Додаткові стилі для textarea, щоб вона виглядала гарно з класом glass-input */
    .textarea-resize {
        resize: vertical;
        min-height: 80px;
        font-family: inherit;
        line-height: 1.4;
    }

    .actions-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 12px;
        gap: 16px;
    }
</style>
