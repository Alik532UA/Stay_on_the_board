<script lang="ts">
    import { t } from "$lib/i18n/typedI18n";
    import StyledButton from "$lib/components/ui/StyledButton.svelte";
    import type { FeedbackType } from "$lib/services/feedbackService";
    import { createEventDispatcher } from "svelte";

    export let selectedType: FeedbackType | null;
    export let pageLocation: string;
    export let isSubmitting: boolean;

    export let textContent: string;
    export let actualResult: string;
    export let expectedResult: string;

    const dispatch = createEventDispatcher();

    function goBack() {
        dispatch("back");
    }

    function handleSubmit() {
        dispatch("submit");
    }
</script>

<div class="form-container">
    {#if selectedType === "improvement" || selectedType === "bug"}
        <div class="form-group">
            <label for="fb-page">{$t("ui.feedback.pageLabel")}</label>
            <input
                id="fb-page"
                type="text"
                bind:value={pageLocation}
                class="glass-input"
            />
        </div>
    {/if}

    {#if selectedType === "improvement"}
        <div class="form-group">
            <label for="fb-text">{$t("ui.feedback.improvementLabel")} *</label>
            <textarea
                id="fb-text"
                bind:value={textContent}
                class="glass-input textarea-resize"
                rows="4"
            ></textarea>
        </div>
    {/if}

    {#if selectedType === "reward_suggestion"}
        <div class="form-group">
            <label for="fb-reward">{$t("ui.feedback.rewardLabel")} *</label>
            <textarea
                id="fb-reward"
                bind:value={textContent}
                class="glass-input textarea-resize"
                rows="5"
                placeholder="Наприклад: 'Майстер захисту' - виграти гру, не втративши жодного очка..."
            ></textarea>
        </div>
    {/if}

    {#if selectedType === "bug"}
        <div class="form-group">
            <label for="fb-actual"
                >{$t("ui.feedback.actualResultLabel")} *</label
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
                >{$t("ui.feedback.expectedResultLabel")} *</label
            >
            <textarea
                id="fb-expected"
                bind:value={expectedResult}
                class="glass-input textarea-resize"
                rows="3"
            ></textarea>
        </div>
    {/if}

    {#if selectedType === "other"}
        <div class="form-group">
            <label for="fb-desc">{$t("ui.feedback.descriptionLabel")} *</label>
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
            ← {$t("ui.goBack")}
        </StyledButton>
        <StyledButton
            variant="primary"
            size="large"
            on:click={handleSubmit}
            disabled={isSubmitting}
        >
            {isSubmitting ? $t("common.loading") : $t("ui.feedback.submit")}
        </StyledButton>
    </div>
</div>

<style>
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
