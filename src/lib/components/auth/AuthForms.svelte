<script lang="ts">
    import { t } from "$lib/i18n/typedI18n";
    import StyledButton from "$lib/components/ui/StyledButton.svelte";
    import { createEventDispatcher } from "svelte";

    export let mode: "link" | "login" | "reset";
    export let email = "";
    export let password = "";
    export let isLoading = false;

    const dispatch = createEventDispatcher();

    function handleSubmit() {
        dispatch("submit");
    }

    function setMode(newMode: "link" | "login" | "reset") {
        dispatch("setMode", newMode);
    }
</script>

{#if mode === "link"}
    <h3 class="title">{$t("ui.auth.titleSave")}</h3>
    <p class="description">{$t("ui.auth.saveDescription")}</p>
{:else if mode === "login"}
    <h3 class="title">{$t("ui.auth.titleLogin")}</h3>
{:else}
    <h3 class="title">{$t("ui.auth.titleReset")}</h3>
{/if}

<div class="form-group">
    <label for="auth-email">{$t("ui.auth.emailLabel")}</label>
    <input
        id="auth-email"
        type="email"
        bind:value={email}
        class="glass-input"
        placeholder="name@example.com"
    />
</div>

{#if mode !== "reset"}
    <div class="form-group">
        <label for="auth-password">{$t("ui.auth.passwordLabel")}</label>
        <input
            id="auth-password"
            type="password"
            bind:value={password}
            class="glass-input"
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
            {$t("common.loading")}
        {:else if mode === "link"}
            {$t("ui.auth.saveBtn")}
        {:else if mode === "login"}
            {$t("ui.auth.loginBtn")}
        {:else}
            {$t("ui.auth.resetBtn")}
        {/if}
    </StyledButton>
</div>

<div class="links">
    {#if mode === "link"}
        <button class="link-btn" on:click={() => setMode("login")}>
            {$t("ui.auth.switchLogin")}
        </button>
    {:else if mode === "login"}
        <button class="link-btn" on:click={() => setMode("link")}>
            {$t("ui.auth.switchRegister")}
        </button>
        <button class="link-btn" on:click={() => setMode("reset")}>
            {$t("ui.auth.forgotPassword")}
        </button>
    {:else}
        <button class="link-btn" on:click={() => setMode("login")}>
            {$t("ui.auth.backToLogin")}
        </button>
    {/if}
</div>

<style>
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
</style>
