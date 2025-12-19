<script lang="ts">
    import SvgIcons from "$lib/components/SvgIcons.svelte";
    import EditableText from "$lib/components/ui/EditableText.svelte";
    import { userProfileStore, authService } from "$lib/services/authService";

    function handleNameChange(e: CustomEvent<string>) {
        authService.updateNickname(e.detail);
    }
</script>

<div class="personal-best-section">
    <div class="pb-card">
        <div class="pb-icon">
            <SvgIcons name="stopwatch_gold" />
        </div>
        <div class="pb-info">
            <div class="pb-label">Мій рекорд (Гра на час)</div>
            <div class="pb-value">
                {$userProfileStore?.bestTimeScore || 0}
            </div>
            <div class="pb-name">
                <span class="label">Ім'я в рейтингу:</span>
                <EditableText
                    value={$userProfileStore?.displayName || "Player"}
                    canEdit={true}
                    onRandom={() =>
                        `Player ${Math.floor(Math.random() * 1000)}`}
                    on:change={handleNameChange}
                />
            </div>
        </div>
    </div>
</div>

<style>
    /* Personal Best Card */
    .pb-card {
        background: linear-gradient(
            135deg,
            rgba(255, 215, 0, 0.1),
            rgba(255, 165, 0, 0.05)
        );
        border: 1px solid rgba(255, 215, 0, 0.3);
        border-radius: 16px;
        padding: 20px;
        display: flex;
        align-items: center;
        gap: 20px;
    }

    .pb-icon {
        width: 60px;
        height: 60px;
        color: gold;
    }

    .pb-info {
        flex: 1;
    }

    .pb-label {
        font-size: 0.9em;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 1px;
    }
    .pb-value {
        font-size: 2.5em;
        font-weight: 800;
        color: var(--text-primary);
        line-height: 1.1;
    }
    .pb-name {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-top: 5px;
        font-size: 0.9em;
    }
    .pb-name .label {
        color: var(--text-secondary);
    }

    @media (max-width: 600px) {
        .pb-card {
            flex-direction: column;
            text-align: center;
        }
        .pb-name {
            justify-content: center;
            flex-direction: column;
            gap: 5px;
        }
    }
</style>
