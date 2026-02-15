<script lang="ts">
    import { t } from "$lib/i18n/typedI18n";
    import {
        feedbackService,
        type FeedbackType,
    } from "$lib/services/feedbackService";
    import { modalStore } from "$lib/stores/modalStore";
    import { logService } from "$lib/services/logService";
    import { onMount } from "svelte";

    import { userStore } from "$lib/services/authService";
    import AuthModal from "$lib/components/modals/AuthModal.svelte";
    import GlobalChatModal from "$lib/components/modals/GlobalChatModal.svelte";

    // FIX: Import new sub-components
    import FeedbackMenu from "./feedback/FeedbackMenu.svelte";
    import FeedbackForm from "./feedback/FeedbackForm.svelte";

    export let initialType: FeedbackType | null = null;

    let selectedType: FeedbackType | null = initialType;
    let isSubmitting = false;

    let pageLocation = "";
    let textContent = "";
    let actualResult = "";
    let expectedResult = "";

    onMount(() => {
        if (typeof window !== "undefined") {
            pageLocation = window.location.pathname;
        }
    });

    function selectType(e: CustomEvent<FeedbackType>) {
        const type = e.detail;
        logService.ui(`[FeedbackModal] Selected type: ${type}`);
        selectedType = type;
    }

    function handleGlobalChat() {
        logService.action('Click: "Global Chat" (FeedbackModal)');

        if (!$userStore || $userStore.isAnonymous) {
            logService.ui(
                "[FeedbackModal] User not logged in. Redirecting to AuthModal.",
            );
            modalStore.showModalAsReplacement({
                component: AuthModal,
                dataTestId: "auth-modal",
                variant: "menu",
                closeOnOverlayClick: true,
            });
        } else {
            logService.ui(
                "[FeedbackModal] User logged in. Opening GlobalChatModal.",
            );
            modalStore.showModalAsReplacement({
                component: GlobalChatModal,
                dataTestId: "global-chat-modal",
                variant: "standard",
                closeOnOverlayClick: true,
                customClass: "chat-modal-window",
            });
        }
    }

    async function handleSubmit() {
        if (isSubmitting) return;

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
            isSubmitting = false;
        }
    }

    function goBack() {
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
    <h2 class="modal-title-menu">{$t("ui.feedback.title")}</h2>

    {#if !selectedType}
        <FeedbackMenu on:select={selectType} on:globalChat={handleGlobalChat} />
    {:else}
        <FeedbackForm
            {selectedType}
            bind:pageLocation
            {isSubmitting}
            bind:textContent
            bind:actualResult
            bind:expectedResult
            on:back={goBack}
            on:submit={handleSubmit}
        />
    {/if}
</div>

<style>
    .feedback-modal-container {
        display: flex;
        flex-direction: column;
        gap: 24px;
        width: 100%;
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
</style>
