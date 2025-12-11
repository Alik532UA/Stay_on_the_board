<script lang="ts">
    import { _ } from "svelte-i18n";
    import {
        feedbackService,
        type FeedbackType,
    } from "$lib/services/feedbackService";
    import { modalStore } from "$lib/stores/modalStore";
    import StyledButton from "$lib/components/ui/StyledButton.svelte";
    import { logService } from "$lib/services/logService";
    import { onMount } from "svelte";

    // Стан компонента
    let selectedType: FeedbackType | null = null;
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
            // Закриття модалки (Варіант 4A)
            modalStore.closeModal();
        } catch (e) {
            // Помилка вже оброблена в сервісі (notification), тут просто знімаємо блокування
            isSubmitting = false;
        }
    }

    function goBack() {
        selectedType = null;
        textContent = "";
        actualResult = "";
        expectedResult = "";
    }
</script>

<div class="feedback-modal">
    {#if !selectedType}
        <!-- Крок 1: Вибір типу -->
        <h3 class="subtitle">{$_("ui.feedback.selectType")}</h3>
        <div class="buttons-stack">
            <StyledButton
                variant="info"
                on:click={() => selectType("improvement")}
            >
                {$_("ui.feedback.typeImprovement")}
            </StyledButton>
            <StyledButton variant="danger" on:click={() => selectType("bug")}>
                {$_("ui.feedback.typeBug")}
            </StyledButton>
            <StyledButton
                variant="default"
                on:click={() => selectType("other")}
            >
                {$_("ui.feedback.typeOther")}
            </StyledButton>
        </div>
    {:else}
        <!-- Крок 2: Форма -->
        <div class="form-container">
            <!-- Спільне поле для Improvement та Bug -->
            {#if selectedType === "improvement" || selectedType === "bug"}
                <div class="form-group">
                    <label for="fb-page">{$_("ui.feedback.pageLabel")}</label>
                    <input
                        id="fb-page"
                        type="text"
                        bind:value={pageLocation}
                        class="modal-input"
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
                        class="modal-textarea"
                        rows="4"
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
                        class="modal-textarea"
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
                        class="modal-textarea"
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
                        class="modal-textarea"
                        rows="5"
                    ></textarea>
                </div>
            {/if}

            <div class="actions-row">
                <StyledButton
                    variant="default"
                    size="small"
                    on:click={goBack}
                    disabled={isSubmitting}
                >
                    ← {$_("ui.goBack")}
                </StyledButton>
                <StyledButton
                    variant="primary"
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
    .feedback-modal {
        display: flex;
        flex-direction: column;
        gap: 16px;
        width: 100%;
    }
    .subtitle {
        text-align: center;
        color: var(--text-secondary);
        margin-bottom: 8px;
    }
    .buttons-stack {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }
    .form-container {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }
    .form-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
        text-align: left;
    }
    label {
        font-size: 0.9em;
        font-weight: bold;
        color: var(--text-secondary);
    }
    .modal-input,
    .modal-textarea {
        background: rgba(0, 0, 0, 0.2);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        padding: 10px;
        color: var(--text-primary);
        font-family: inherit;
        font-size: 1em;
        width: 100%;
        box-sizing: border-box;
    }
    .modal-input:focus,
    .modal-textarea:focus {
        outline: none;
        border-color: var(--control-selected);
        box-shadow: 0 0 0 2px rgba(var(--control-selected-rgb), 0.2);
    }
    .actions-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 8px;
        gap: 12px;
    }
</style>
