<script>
  import FloatingBackButton from "$lib/components/FloatingBackButton.svelte";
  import AccordionSection from "$lib/components/AccordionSection.svelte";
  import { _ } from "svelte-i18n";
  import { base } from "$app/paths";
</script>

<div class="rules-page">
  <FloatingBackButton />
  <div class="rules-header">
    <div class="header-container">
      <div class="title-container">
        <h1>{$_("rulesPage.title")}</h1>
        <!-- <div class="rules-slogan">{$_('rulesPage.slogan')}</div> -->
      </div>
    </div>
  </div>

  <AccordionSection isOpen={true}>
    <span slot="title">🎯 {$_("rulesPage.goalTitle")}</span>
    <p class="rules-text">{$_("rulesPage.goalText")}</p>
  </AccordionSection>

  <AccordionSection>
    <span slot="title">🧭 {$_("rulesPage.moveProcessTitle")}</span>
    <ol>
      <li>
        <b>{$_("rulesPage.step1")}</b>
        {$_("rulesPage.step1Text")}
        <div class="directions-grid-visual">
          <div class="dir-btn-visual">↖</div>
          <div class="dir-btn-visual">↑</div>
          <div class="dir-btn-visual">↗</div>
          <div class="dir-btn-visual">←</div>
          <div class="dir-btn-visual center-piece">♛</div>
          <div class="dir-btn-visual">→</div>
          <div class="dir-btn-visual">↙</div>
          <div class="dir-btn-visual">↓</div>
          <div class="dir-btn-visual">↘</div>
        </div>
      </li>
      <li><b>{$_("rulesPage.step2")}</b> {$_("rulesPage.step2Text")}</li>
      <li><b>{$_("rulesPage.step3")}</b> {$_("rulesPage.step3Text")}</li>
    </ol>
  </AccordionSection>

  <AccordionSection>
    <span slot="title">🏆 {$_("rulesPage.winningAndLosing")}</span>
    <div class="rules-cards-row">
      <div class="rules-card rules-lose">
        <h3>{$_("rulesPage.youLose")}</h3>
        <ul>
          <li>{$_("rulesPage.lose1")}</li>
          <li>{$_("rulesPage.lose2")}</li>
          <li>{$_("rulesPage.lose3")}</li>
        </ul>
      </div>
      <div class="rules-card rules-win">
        <h3>{$_("rulesPage.youWin")}</h3>
        <ul>
          <li>{$_("rulesPage.win1")}</li>
          <li>{$_("rulesPage.win2")}</li>
        </ul>
      </div>
    </div>
  </AccordionSection>

  <AccordionSection>
    <span slot="title">⚔️ {$_("rulesPage.gameModes")}</span>
    <div class="rules-cards-row">
      <div class="rules-card rules-mode-normal">
        <h3>{$_("rulesPage.normalMode")}</h3>
        <p>{$_("rulesPage.normalModeText")}</p>
      </div>
      <div class="rules-card rules-mode-block">
        <h3>{$_("rulesPage.blockMode")}</h3>
        <p>{$_("rulesPage.blockModeText")}</p>
      </div>
    </div>
  </AccordionSection>

  <AccordionSection>
    <span slot="title">📜 {$_("rulesPage.specialRules")}</span>
    <div class="rules-card rules-no-moves">
      <h2>{$_("rulesPage.noMovesButtonTitle")}</h2>
      <p>{$_("rulesPage.noMovesButtonText1")}</p>
      <ul>
        <li><b>{$_("rulesPage.noMovesWin")}</b></li>
        <li><b>{$_("rulesPage.noMovesLoss")}</b></li>
      </ul>
      <p>{$_("rulesPage.noMovesButtonText2")}</p>
    </div>
    <div class="rules-card rules-scoring">
      <h2>{$_("rulesPage.scoringTitle")}</h2>
      <p>{$_("rulesPage.scoringText")}</p>
      <ul>
        <li>{$_("rulesPage.scoreNormal")}</li>
        <li>{$_("rulesPage.scoreHidePiece")}</li>
        <li>{$_("rulesPage.scoreHideBoard")}</li>
      </ul>
    </div>
  </AccordionSection>

  <AccordionSection>
    <span slot="title">🔥 {$_("rulesPage.proModeTitle")}</span>
    <div class="rules-card rules-pro-mode">
      <p>{$_("rulesPage.proModeText")}</p>
      <p><b>{$_("rulesPage.proModeTip")}</b></p>
      <ol>
        <li>{$_("rulesPage.proModeStep1")}</li>
        <li>{$_("rulesPage.proModeStep2")}</li>
        <li>{$_("rulesPage.proModeStep3")}</li>
        <li>
          {@html $_("rulesPage.proModeStep4", {
            values: { controlsLink: `${base}/controls` },
          })}
        </li>
      </ol>
      <p>{$_("rulesPage.proModeConclusion")}</p>
      <p>{$_("rulesPage.proModeNextLevel")}</p>
    </div>
  </AccordionSection>
</div>

<style>
  .rules-page {
    max-width: 700px;
    margin: 0 auto;
    padding: 1rem 1rem 3rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .rules-header {
    position: relative;
    padding: 0.75rem;
    text-align: center;
    background: transparent;
    /* backdrop-filter: blur(16px); */
    /* -webkit-backdrop-filter: blur(16px); */
    border: none;
    box-shadow: none;
    border-radius: 24px;
    overflow: hidden;
    z-index: 1;
  }

  .rules-header::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--bg-secondary);
    opacity: 0; /* 10% opacity for the background */
    z-index: -1;
    border-radius: 24px;
  }

  .header-container {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
  }

  .title-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .rules-header h1 {
    font-size: 2.2em;
    color: #fffde7;
    font-weight: 700;
    text-wrap: balance;
  }

  /* --- Modal-like styling applied to Accordion --- */
  :global(.accordion-section) {
    position: relative;
    background: transparent;
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: var(--global-border-width) solid rgba(255, 255, 255, 0.05) !important;
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.1);
    border-radius: 24px;
    overflow: hidden;
  }
  :global(.accordion-section::before) {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--bg-secondary);
    opacity: 0.1; /* 10% opacity for the background */
    z-index: -1;
    border-radius: 24px;
  }

  :global(.accordion-header) {
    padding: 20px 24px;
    background: transparent !important;
  }
  :global(.accordion-header:hover) {
    background: transparent !important;
  }
  :global(.accordion-title) {
    margin: 0;
    font-size: 1.8em;
    font-weight: 700;
    color: #fffde7;
    text-align: center;
  }
  :global(.accordion-toggle svg) {
    color: rgba(255, 255, 255, 0.7);
  }

  :global(.accordion-content) {
    padding: 0;
    color: var(--text-primary, #fff);
    background: transparent;
  }
  :global(.accordion-content .content-wrapper) {
    padding: 20px 24px;
    background: rgba(0, 0, 0, 0.1); /* 10% opaque black background */
    border-top: var(--global-border-width) solid rgba(255, 255, 255, 0.1);
  }
  /* --- End of Modal-like styling --- */

  /* Styling for cards inside accordion */
  .rules-card {
    background: none;
    border-radius: 0;
    box-shadow: none;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.7em;
  }
  .rules-card:not(:first-child) {
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: var(--global-border-width) solid rgba(255, 255, 255, 0.1);
  }

  .rules-cards-row {
    display: flex;
    flex-direction: row;
    gap: 1.2em;
    justify-content: center;
  }

  .rules-cards-row .rules-card {
    flex: 1;
    padding: 0;
    margin-top: 0;
    padding-top: 0;
    border-top: none;
    background: none;
    border-radius: 0;
  }

  ul,
  ol {
    margin: 0.5em 0 0.5em 1.2em;
    line-height: 1.7;
  }
  h2,
  h3 {
    margin-top: 0.2em;
    margin-bottom: 0.2em;
  }
  p {
    white-space: pre-line;
    line-height: 1.6;
  }
  .directions-grid-visual {
    display: grid;
    grid-template-columns: repeat(3, 48px);
    grid-template-rows: repeat(3, 48px);
    gap: 6px;
    justify-content: center;
    margin: 1.2em 0;
    font-family: "M PLUS Rounded 1c", sans-serif;
  }
  .dir-btn-visual {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.3em;
    border-radius: 10px;
    background: var(--control-bg, #f0e8f2);
    color: var(--text-primary, #442c2e);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.07);
    border: var(--global-border-width) solid
      var(--border-color, rgba(233, 84, 32, 0.3));
  }
  .dir-btn-visual.center-piece {
    font-size: 1.6em;
    background: var(--cell-dark, #e4d5c6);
    color: var(--piece-color, #3a2a22);
    border: none;
  }

  :global(.inline-link-button) {
    display: inline-block;
    padding: 0.1em 0.4em;
    margin: 0 0.2em;
    line-height: 1.2;
    font-size: 0.9em;
    text-decoration: none;
    color: var(--text-primary);
    background-color: var(--control-bg);
    border: var(--global-border-width) solid var(--border-color);
    border-radius: 4px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.07);
  }

  @media (max-width: 600px) {
    .rules-cards-row {
      flex-direction: column;
      gap: 1.2em;
    }
    .rules-header h1 {
      font-size: 1.8em;
    }
  }
</style>
