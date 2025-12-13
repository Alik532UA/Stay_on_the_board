<script lang="ts">
    import { _ } from "svelte-i18n";
    import { authService } from "$lib/services/authService";
    import { modalStore } from "$lib/stores/modalStore";
    import StyledButton from "$lib/components/ui/StyledButton.svelte";
    import { logService } from "$lib/services/logService";

    // Modes: 'link' (register/save), 'login', 'reset'
    let mode: "link" | "login" | "reset" = "link";

    let email = "";
    let password = "";
    let isLoading = false;

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
            modalStore.closeModal();
        }
    }
</script>

<div class="auth-modal">
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
</div>

<style>
    .auth-modal {
        display: flex;
        flex-direction: column;
        gap: 16px;
        width: 100%;
        max-width: 320px;
        margin: 0 auto;
    }
    .title {
        text-align: center;
        margin: 0;
        color: var(--text-primary);
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
</style>
