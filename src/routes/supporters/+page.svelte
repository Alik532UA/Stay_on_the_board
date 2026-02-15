<script>
  import FloatingBackButton from "$lib/components/FloatingBackButton.svelte";
  import { t } from "$lib/i18n/typedI18n";
  import { base } from "$app/paths";
</script>

<div class="supporters-container">
  <div class="header-container">
    <FloatingBackButton />
    <h1>{$t("supportersPage.title")}</h1>
  </div>
  <p class="gratitude-text">{$t("supportersPage.gratitudeText")}</p>

  <div class="supporters-list">
    <a
      href="https://steamcommunity.com/profiles/76561198948943743/"
      target="_blank"
      rel="noopener noreferrer"
      class="supporter-item">den</a
    >
    <div class="supporter-item">brusnikaa</div>
    <a
      href="https://steamcommunity.com/profiles/76561198055854871/"
      target="_blank"
      rel="noopener noreferrer"
      class="supporter-item">Khaaaa</a
    >
    <div class="supporter-item">Destroyter94</div>
    <div class="supporter-item">MrGrom</div>
    <!-- Майбутні імена будуть додаватися сюди -->
  </div>
        <p class="call-to-action-text" style="white-space: pre-line">{$t("supportersPage.callToAction")}</p>  <a
    href="https://send.monobank.ua/jar/8TPmFKQTCK"
    target="_blank"
    rel="noopener noreferrer"
    class="support-btn"
  >
    {$t("supportersPage.supportButton")}
  </a>

  <div class="qr-code-section">
    <a
      href="https://send.monobank.ua/jar/8TPmFKQTCK"
      target="_blank"
      rel="noopener noreferrer"
      class="qr-code-link"
    >
      <img
        src="{base}/qrcode-monobank.svg"
        alt="Monobank QR Code"
        class="qr-code-image"
      />
    </a>
  </div>
</div>

<style>
  .supporters-container {
    text-align: center;
    max-width: 800px;
    margin: 2rem auto;
    color: var(--text-primary);
  }

  .header-container {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 2rem;
  }
  .gratitude-text {
    font-size: 1.2em;
    line-height: 1.6;
    margin-bottom: 2.5rem;
    color: var(--text-secondary);
  }
  .supporters-list {
    margin-top: 2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }
  .supporter-item {
    font-size: 1.3em;
    font-weight: 600;
    color: var(--text-accent, #ff9800);
    background: rgba(255, 255, 255, 0.05);
    padding: 0.5em 1.5em;
    border-radius: 8px;
    border: var(--global-border-width) solid
      var(--border-color, rgba(255, 152, 0, 0.3));
    cursor: pointer;
    text-decoration: none;
    transition: all 0.2s ease;
  }

  .supporter-item:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(255, 152, 0, 0.2);
  }
  .call-to-action-text {
    margin-top: 3rem;
    font-size: 1.1em;
    line-height: 1.7;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
    color: var(--text-secondary);
  }
  .call-to-action-text :global(a) {
    color: var(--text-accent, #ff9800);
    text-decoration: none; /* Прибираємо підкреслення */
    font-weight: 600;
    transition: color 0.2s;
  }
  .call-to-action-text :global(a:hover) {
    color: #fff;
  }

  .support-btn {
    margin-top: 2rem;
    background: linear-gradient(90deg, #4caf50 60%, #45a049 100%);
    color: #fff;
    border: none;
    border-radius: 12px;
    padding: 14px 36px;
    font-weight: bold;
    cursor: pointer;
    font-size: 1.2em;
    display: inline-block;
    text-decoration: none;
    transition: all 0.2s ease;
  }

  .support-btn:hover {
    transform: scale(1.05);
  }

  .qr-code-section {
    margin-top: 3rem;
    display: flex;
    justify-content: center;
    padding: 1rem;
  }

  .qr-code-image {
    max-width: 250px;
    height: auto;
    border-radius: 16px;
    background: white;
    padding: 1rem;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    transition: transform 0.3s ease;
    cursor: pointer;
  }

  .qr-code-image:hover {
    transform: scale(1.02);
  }
</style>
