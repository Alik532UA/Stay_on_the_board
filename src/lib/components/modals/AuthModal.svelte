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
    let newPassword = ""; // Для зміни пароля
    let isLoading = false;

    // Sub-modes for Profile view
    let isDeleteMode = false;
    let isChangePasswordMode = false;

    // Визначаємо, чи користувач повноцінно авторизований (не анонім)
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
            // Якщо успішно залогінились/прив'язали, модалка не закривається, а показує профіль
            // Але якщо це було відновлення паролю - закриваємо
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
            // Можна додати валідацію тут або покластися на authService
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

<div class="auth-modal-content">
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
