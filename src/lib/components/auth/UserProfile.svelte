<script lang="ts">
    import { t } from "$lib/i18n/typedI18n";
    import { authService, userStore } from "$lib/services/authService";
    import { userProfileStore } from "$lib/services/auth/userProfileService";
    import StyledButton from "$lib/components/ui/StyledButton.svelte";
    import EditableText from "$lib/components/ui/EditableText.svelte";
    import { generateRandomPlayerName } from "$lib/utils/nameGenerator";

    export let isDeleteMode = false;
    export let isChangePasswordMode = false;
    export let isLoading = false;

    export let deletePassword = "";
    export let newPassword = "";

    // Event dispatchers usually emitted from buttons
    import { createEventDispatcher } from "svelte";
    const dispatch = createEventDispatcher();

    function handleNameChange(e: CustomEvent<string>) {
        authService.updateNickname(e.detail);
    }

    function handleLogout() {
        dispatch("logout");
    }

    function toggleChangePassword() {
        dispatch("toggleChangePassword");
    }

    function toggleDeleteAccount() {
        dispatch("toggleDeleteAccount");
    }

    function handleDeleteAccount() {
        dispatch("deleteAccount");
    }

    function handleChangePassword() {
        dispatch("changePassword");
    }

    function cancelMode() {
        dispatch("cancelMode");
    }
</script>

<h3 class="title">{$t("ui.auth.titleProfile")}</h3>

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

{#if !isDeleteMode && !isChangePasswordMode}
    <!-- MAIN PROFILE ACTIONS -->
    <div class="actions">
        <StyledButton variant="default" on:click={toggleChangePassword}>
            {$t("ui.auth.changePasswordBtn")}
        </StyledButton>

        <StyledButton variant="default" on:click={handleLogout}>
            {$t("ui.auth.logoutBtn")}
        </StyledButton>

        <StyledButton
            variant="danger"
            on:click={toggleDeleteAccount}
            style="margin-top: 10px;"
        >
            {$t("ui.auth.deleteAccountBtn")}
        </StyledButton>
    </div>
{:else if isChangePasswordMode}
    <!-- CHANGE PASSWORD VIEW -->
    <div class="change-password-zone">
        <div class="form-group">
            <label for="new-password">{$t("ui.auth.newPasswordLabel")}</label>
            <input
                id="new-password"
                type="password"
                bind:value={newPassword}
                class="glass-input"
                placeholder="******"
            />
        </div>
        <div class="actions">
            <StyledButton
                variant="primary"
                on:click={handleChangePassword}
                disabled={isLoading || !newPassword}
            >
                {isLoading
                    ? $t("common.loading")
                    : $t("ui.auth.savePasswordBtn")}
            </StyledButton>
            <button class="link-btn" on:click={cancelMode}>
                {$t("ui.auth.cancelChangePasswordBtn")}
            </button>
        </div>
    </div>
{:else if isDeleteMode}
    <!-- DELETE ACCOUNT CONFIRMATION -->
    <div class="delete-zone">
        <p class="warning-text">{$t("ui.auth.deleteWarning")}</p>
        <div class="form-group">
            <label for="delete-password">{$t("ui.auth.passwordLabel")}</label>
            <input
                id="delete-password"
                type="password"
                bind:value={deletePassword}
                class="glass-input danger-input"
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
                    ? $t("common.loading")
                    : $t("ui.auth.confirmDeleteBtn")}
            </StyledButton>
            <button class="link-btn" on:click={cancelMode}>
                {$t("ui.auth.cancelDeleteBtn")}
            </button>
        </div>
    </div>
{/if}

<style>
    .title {
        text-align: center;
        margin: 0;
        color: var(--text-primary);
        font-size: 1.4em;
    }
    .profile-info {
        background: rgba(255, 255, 255, 0.05);
        padding: 16px;
        border-radius: 12px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        align-items: center;
        text-align: center;
    }
    .info-row {
        display: flex;
        flex-direction: column;
        gap: 4px;
        align-items: center;
        width: 100%;
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

    .actions {
        margin-top: 8px;
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .change-password-zone {
        background: rgba(255, 255, 255, 0.05);
        padding: 16px;
        border-radius: 12px;
        margin-top: 10px;
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .delete-zone {
        border: var(--global-border-width) solid var(--error-color);
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
</style>
