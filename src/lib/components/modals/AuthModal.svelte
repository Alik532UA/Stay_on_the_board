<script lang="ts">
    import { _ } from "svelte-i18n";
    import { authService, userStore } from "$lib/services/authService";
    import { modalStore } from "$lib/stores/modalStore";
    import UserProfile from "$lib/components/auth/UserProfile.svelte";
    import AuthForms from "$lib/components/auth/AuthForms.svelte";

    // Modes: 'link' (register/save), 'login', 'reset'
    let mode: "link" | "login" | "reset" = "link";

    let email = "";
    let password = "";
    let deletePassword = "";
    let newPassword = "";
    let isLoading = false;

    let isDeleteMode = false;
    let isChangePasswordMode = false;

    $: isAuthorized = $userStore && !$userStore.isAnonymous;

    async function handleSubmit() {
        if (!email) return;
        isLoading = true;
        let success = false;

        if (mode === "link") {
            if (!password) {
                isLoading = false;
                return;
            }
            success = await authService.linkEmailPassword(email, password);
        } else if (mode === "login") {
            if (!password) {
                isLoading = false;
                return;
            }
            success = await authService.loginEmailPassword(email, password);
        } else if (mode === "reset") {
            success = await authService.resetPassword(email);
        }

        isLoading = false;
        if (success) {
            if (mode === "reset") modalStore.closeModal();
        }
    }

    async function handleLogout() {
        await authService.logout();
        modalStore.closeModal();
    }

    async function handleDeleteAccount() {
        if (!deletePassword) return;
        isLoading = true;
        const success = await authService.deleteAccount(deletePassword);
        isLoading = false;
        if (success) {
            modalStore.closeModal();
        }
    }

    async function handleChangePassword() {
        if (!newPassword || newPassword.length < 6) {
            return;
        }
        isLoading = true;
        const success = await authService.changePassword(newPassword);
        isLoading = false;
        if (success) {
            isChangePasswordMode = false;
            newPassword = "";
        }
    }
</script>

<!-- FIX: Додано data-testid -->
<div class="auth-modal-content" data-testid="auth-modal-content">
    {#if isAuthorized}
        <UserProfile
            bind:isDeleteMode
            bind:isChangePasswordMode
            bind:deletePassword
            bind:newPassword
            {isLoading}
            on:logout={handleLogout}
            on:deleteAccount={handleDeleteAccount}
            on:changePassword={handleChangePassword}
            on:toggleChangePassword={() =>
                (isChangePasswordMode = !isChangePasswordMode)}
            on:toggleDeleteAccount={() => (isDeleteMode = !isDeleteMode)}
            on:cancelMode={() => {
                isDeleteMode = false;
                isChangePasswordMode = false;
                deletePassword = "";
                newPassword = "";
            }}
        />
    {:else}
        <AuthForms
            bind:mode
            bind:email
            bind:password
            {isLoading}
            on:submit={handleSubmit}
            on:setMode={(e) => (mode = e.detail)}
        />
    {/if}
</div>

<style>
    .auth-modal-content {
        display: flex;
        flex-direction: column;
        gap: 16px;
        width: 100%;
        margin: 0 auto;
        background: transparent;
        box-shadow: none;
        border: none;
        backdrop-filter: none;
        padding: 24px;
    }
</style>
