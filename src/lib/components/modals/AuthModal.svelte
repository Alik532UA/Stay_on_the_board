<script lang="ts">
    import { _ } from "svelte-i18n";
    import {
        authService,
        userStore,
        userProfileStore,
    } from "$lib/services/authService";
    import { modalStore } from "$lib/stores/modalStore";
    import StyledButton from "$lib/components/ui/StyledButton.svelte";
    import EditableText from "$lib/components/ui/EditableText.svelte";
    import { generateRandomPlayerName } from "$lib/utils/nameGenerator";
    import { logService } from "$lib/services/logService";

    // Modes: 'link' (register/save), 'login', 'reset'
    let mode: "link" | "login" | "reset" = "link";

    let email = "";
    let password = "";
    let deletePassword = "";
    let isLoading = false;
    let isDeleteMode = false; // Для показу форми видалення

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

    function handleNameChange(e: CustomEvent<string>) {
        authService.updateNickname(e.detail);
    }
</script>

<div class="auth-modal">
    {#if isAuthorized}
        <!-- PROFILE VIEW -->
        <h3 class="title">{$_("ui.auth.titleProfile")}</h3>

        <div class="profile-info">
            <div class="info-row">
                <span class="label">Email:</span>
                <span class="value">{$userStore?.email}</span>
            </div>
            <div class="info-row">
                <span class="label">Нікнейм:</span>
                <EditableText
                    value={$userProfileStore?.displayName || "Player"}
                    canEdit={true}
                    onRandom={generateRandomPlayerName}
                    on:change={handleNameChange}
                    dataTestId="profile-nickname-edit"
                />
            </div>
        </div>

        {#if !isDeleteMode}
            <div class="actions">
                <StyledButton variant="default" on:click={handleLogout}>
                    {$_("ui.auth.logoutBtn")}
                </StyledButton>

                <StyledButton
                    variant="danger"
                    on:click={() => (isDeleteMode = true)}
                    style="margin-top: 10px;"
                >
                    {$_("ui.auth.deleteAccountBtn")}
                </StyledButton>
            </div>
        {:else}
            <!-- DELETE ACCOUNT CONFIRMATION -->
            <div class="delete-zone">
                <p class="warning-text">{$_("ui.auth.deleteWarning")}</p>
                <div class="form-group">
                    <label for="delete-password"
                        >{$_("ui.auth.passwordLabel")}</label
                    >
                    <input
                        id="delete-password"
                        type="password"
                        bind:value={deletePassword}
                        class="modal-input danger-input"
                        placeholder="******"
                    />
                </div>
                <div class="actions">
                    <StyledButton
                        variant="danger"
                        on:click={handleDeleteAccount}
                        disabled={isLoading || !deletePassword}
                    >
                        {isLoading
                            ? $_("common.loading")
                            : $_("ui.auth.confirmDeleteBtn")}
                    </StyledButton>
                    <button
                        class="link-btn"
                        on:click={() => {
                            isDeleteMode = false;
                            deletePassword = "";
                        }}
                    >
                        {$_("ui.auth.cancelDeleteBtn")}
                    </button>
                </div>
            </div>
        {/if}
    {:else}
        <!-- LOGIN / REGISTER VIEW -->
        {#if mode === "link"}
            <h3 class="title">{$_("ui.auth.titleSave")}</h3>
            <p class="description">{$_("ui.auth.saveDescription")}</p>
        {:else if mode === "login"}
            <h3 class="title">{$_("ui.auth.titleLogin")}</h3>
        {:else}
            <h3 class="title">{$_("ui.auth.titleReset")}</h3>
        {/if}

        <div class="form-group">
            <label for="auth-email">{$_("ui.auth.emailLabel")}</label>
            <input
                id="auth-email"
                type="email"
                bind:value={email}
                class="modal-input"
                placeholder="name@example.com"
            />
        </div>

        {#if mode !== "reset"}
            <div class="form-group">
                <label for="auth-password">{$_("ui.auth.passwordLabel")}</label>
                <input
                    id="auth-password"
                    type="password"
                    bind:value={password}
                    class="modal-input"
                    placeholder="******"
                />
            </div>
        {/if}

        <div class="actions">
            <StyledButton
                variant="primary"
                on:click={handleSubmit}
                disabled={isLoading}
            >
                {#if isLoading}
                    {$_("common.loading")}
                {:else if mode === "link"}
                    {$_("ui.auth.saveBtn")}
                {:else if mode === "login"}
                    {$_("ui.auth.loginBtn")}
                {:else}
                    {$_("ui.auth.resetBtn")}
                {/if}
            </StyledButton>
        </div>

        <div class="links">
            {#if mode === "link"}
                <button class="link-btn" on:click={() => (mode = "login")}
                    >{$_("ui.auth.switchLogin")}</button
                >
            {:else if mode === "login"}
                <button class="link-btn" on:click={() => (mode = "link")}
                    >{$_("ui.auth.switchRegister")}</button
                >
                <button class="link-btn" on:click={() => (mode = "reset")}
                    >{$_("ui.auth.forgotPassword")}</button
                >
            {:else}
                <button class="link-btn" on:click={() => (mode = "login")}
                    >{$_("ui.auth.backToLogin")}</button
                >
            {/if}
        </div>
    {/if}
</div>

<style>
    .auth-modal {
        display: flex;
        flex-direction: column;
        gap: 16px;
        width: 100%;
        max-width: 320px;
        margin: 0 auto;
        /* Додаємо фон та розмиття для самого контенту, оскільки вікно прозоре */
        background: rgba(30, 30, 30, 0.6);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        padding: 24px;
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    }
    .title {
        text-align: center;
        margin: 0;
        color: var(--text-primary);
        font-size: 1.4em;
    }
    .description {
        font-size: 0.9em;
        color: var(--text-secondary);
        text-align: center;
        margin: 0;
        line-height: 1.4;
    }
    .form-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }
    label {
        font-size: 0.9em;
        font-weight: bold;
        color: var(--text-secondary);
    }
    .modal-input {
        background: rgba(0, 0, 0, 0.2);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        padding: 10px;
        color: var(--text-primary);
        font-size: 1em;
    }
    .modal-input:focus {
        outline: none;
        border-color: var(--text-accent);
    }
    .actions {
        margin-top: 8px;
        display: flex;
        flex-direction: column;
        gap: 8px;
    }
    .links {
        display: flex;
        flex-direction: column;
        gap: 8px;
        align-items: center;
        margin-top: 8px;
    }
    .link-btn {
        background: none;
        border: none;
        color: var(--text-accent);
        cursor: pointer;
        font-size: 0.9em;
        text-decoration: underline;
        opacity: 0.8;
        transition: opacity 0.2s;
    }
    .link-btn:hover {
        opacity: 1;
    }

    /* Profile Styles */
    .profile-info {
        background: rgba(255, 255, 255, 0.05);
        padding: 16px;
        border-radius: 12px;
        display: flex;
        flex-direction: column;
        gap: 12px;
    }
    .info-row {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }
    .info-row .label {
        font-size: 0.8em;
        text-transform: uppercase;
        opacity: 0.7;
    }
    .info-row .value {
        font-weight: bold;
        font-size: 1.1em;
    }

    /* Delete Zone */
    .delete-zone {
        border: 1px solid var(--error-color);
        background: rgba(244, 67, 54, 0.1);
        padding: 16px;
        border-radius: 12px;
        margin-top: 10px;
    }
    .warning-text {
        color: var(--error-color);
        font-size: 0.9em;
        margin: 0 0 12px 0;
        text-align: center;
    }
    .danger-input {
        border-color: var(--error-color);
    }
</style>
