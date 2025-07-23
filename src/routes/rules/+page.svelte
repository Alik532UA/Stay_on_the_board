<script>
  import FloatingBackButton from '$lib/components/FloatingBackButton.svelte';
  import { _ } from 'svelte-i18n';
</script>

<FloatingBackButton />

<!-- СТАРИЙ КОНТЕНТ ЗБЕРЕЖЕНО ДЛЯ ПОРІВНЯННЯ
<h1>{$_('rulesPage.title')}</h1>

<h2>{$_('rulesPage.goalTitle')}</h2>
<p>{$_('rulesPage.goalText')}</p>

<h2>{$_('rulesPage.moveProcessTitle')}</h2>
<p>{$_('rulesPage.moveProcessText')}</p>
<ol>
  <li><b>{$_('rulesPage.step1')}</b> {$_('rulesPage.step1Text')}
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
  <li><b>{$_('rulesPage.step2')}</b> {$_('rulesPage.step2Text')}</li>
  <li><b>{$_('rulesPage.step3')}</b> {$_('rulesPage.step3Text')}</li>
</ol>

<h2>{$_('rulesPage.winLossTitle')}</h2>
<h3>{$_('rulesPage.youLose')}</h3>
<ul>
  <li>{$_('rulesPage.lose1')}</li>
  <li>{$_('rulesPage.lose2')}</li>
  <li>{$_('rulesPage.lose3')}</li>
</ul>
<h3>{$_('rulesPage.youWin')}</h3>
<ul>
  <li>{$_('rulesPage.win1')}</li>
  <li>{$_('rulesPage.win2')}</li>
</ul>

<h2>{$_('rulesPage.gameModesTitle')}</h2>
<h3>{$_('rulesPage.normalMode')}</h3>
<p>{$_('rulesPage.normalModeText')}</p>
<h3>{$_('rulesPage.blockMode')}</h3>
<p>{$_('rulesPage.blockModeText')}</p>

<h2>{$_('rulesPage.noMovesButtonTitle')}</h2>
<p>{$_('rulesPage.noMovesButtonText1')}</p>
<ul>
  <li><b>{$_('rulesPage.noMovesWin')}</b></li>
  <li><b>{$_('rulesPage.noMovesLoss')}</b></li>
</ul>
<p>{$_('rulesPage.noMovesButtonText2')}</p>

<h2>{$_('rulesPage.scoringTitle')}</h2>
<p>{$_('rulesPage.scoringText')}</p>
<ul>
  <li>{$_('rulesPage.scoreNormal')}</li>
  <li>{$_('rulesPage.scoreHideQueen')}</li>
  <li>{$_('rulesPage.scoreHideBoard')}</li>
</ul>

<h2>{$_('rulesPage.settingsTitle')}</h2>
<h3>{$_('rulesPage.boardSize')}</h3>
<p>{$_('rulesPage.boardSizeText')}</p>

<h2 class="pro-mode-title">{$_('rulesPage.proModeTitle')}</h2>
<p>{$_('rulesPage.proModeText')}</p>
<p><b>{$_('rulesPage.proModeTip')}</b></p>
<ol>
  <li>{$_('rulesPage.proModeStep1')}</li>
  <li>{$_('rulesPage.proModeStep2')}</li>
  <li>{$_('rulesPage.proModeStep3')}</li>
  <li>{$_('rulesPage.proModeStep4')}</li>
</ol>
<p>{$_('rulesPage.proModeConclusion')}</p>
<p>{$_('rulesPage.proModeNextLevel')}</p>
-->

<div class="rules-page">
  <div class="rules-header">
    <span class="rules-icon">♛</span>
    <h1>{$_('rulesPage.title')}</h1>
    <div class="rules-slogan">{$_('rulesPage.slogan')}</div>
  </div>

  <div class="rules-card rules-goal">
    <span class="rules-card-icon">🎯</span>
    <h2>{$_('rulesPage.goalTitle')}</h2>
    <p>{$_('rulesPage.goalText')}</p>
  </div>

  <div class="rules-card rules-move-process">
    <span class="rules-card-icon">🧭</span>
    <h2>{$_('rulesPage.moveProcessTitle')}</h2>
    <ol>
      <li><b>{$_('rulesPage.step1')}</b> {$_('rulesPage.step1Text')}
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
      <li><b>{$_('rulesPage.step2')}</b> {$_('rulesPage.step2Text')}</li>
      <li><b>{$_('rulesPage.step3')}</b> {$_('rulesPage.step3Text')}</li>
    </ol>
  </div>

  <div class="rules-cards-row">
    <div class="rules-card rules-lose">
      <span class="rules-card-icon">❌</span>
      <h3>{$_('rulesPage.youLose')}</h3>
      <ul>
        <li>{$_('rulesPage.lose1')}</li>
        <li>{$_('rulesPage.lose2')}</li>
        <li>{$_('rulesPage.lose3')}</li>
      </ul>
    </div>
    <div class="rules-card rules-win">
      <span class="rules-card-icon">🏆</span>
      <h3>{$_('rulesPage.youWin')}</h3>
      <ul>
        <li>{$_('rulesPage.win1')}</li>
        <li>{$_('rulesPage.win2')}</li>
      </ul>
    </div>
  </div>

  <div class="rules-cards-row">
    <div class="rules-card rules-mode-normal">
      <span class="rules-card-icon">🟢</span>
      <h3>{$_('rulesPage.normalMode')}</h3>
      <p>{$_('rulesPage.normalModeText')}</p>
    </div>
    <div class="rules-card rules-mode-block">
      <span class="rules-card-icon">🔒</span>
      <h3>{$_('rulesPage.blockMode')}</h3>
      <p>{$_('rulesPage.blockModeText')}</p>
    </div>
  </div>

  <div class="rules-card rules-no-moves">
    <span class="rules-card-icon">🚫</span>
    <h2>{$_('rulesPage.noMovesButtonTitle')}</h2>
    <p>{$_('rulesPage.noMovesButtonText1')}</p>
    <ul>
      <li><b>{$_('rulesPage.noMovesWin')}</b></li>
      <li><b>{$_('rulesPage.noMovesLoss')}</b></li>
    </ul>
    <p>{$_('rulesPage.noMovesButtonText2')}</p>
  </div>

  <div class="rules-card rules-scoring">
    <span class="rules-card-icon">⭐</span>
    <h2>{$_('rulesPage.scoringTitle')}</h2>
    <p>{$_('rulesPage.scoringText')}</p>
    <ul>
      <li>{$_('rulesPage.scoreNormal')}</li>
      <li>{$_('rulesPage.scoreHideQueen')}</li>
      <li>{$_('rulesPage.scoreHideBoard')}</li>
    </ul>
  </div>

  <div class="rules-card rules-settings">
    <span class="rules-card-icon">⚙️</span>
    <h2>{$_('rulesPage.settingsTitle')}</h2>
    <h3>{$_('rulesPage.boardSize')}</h3>
    <p>{$_('rulesPage.boardSizeText')}</p>
  </div>

  <div class="rules-card rules-pro-mode">
    <span class="rules-card-icon">🔥</span>
    <h2 class="pro-mode-title">{$_('rulesPage.proModeTitle')}</h2>
    <p>{$_('rulesPage.proModeText')}</p>
    <p><b>{$_('rulesPage.proModeTip')}</b></p>
    <ol>
      <li>{$_('rulesPage.proModeStep1')}</li>
      <li>{$_('rulesPage.proModeStep2')}</li>
      <li>{$_('rulesPage.proModeStep3')}</li>
      <li>{$_('rulesPage.proModeStep4')}</li>
    </ol>
    <p>{$_('rulesPage.proModeConclusion')}</p>
    <p>{$_('rulesPage.proModeNextLevel')}</p>
  </div>

  <!-- FAQ/Підказки можна додати окремим блоком -->
</div>

<style>
.rules-page {
  max-width: 700px;
  margin: 0 auto;
  padding: 2rem 1rem 3rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 2.2rem;
}
.rules-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}
.rules-icon {
  font-size: 2.5em;
  margin-bottom: 0.2em;
}
.rules-slogan {
  font-size: 1.1em;
  color: var(--text-secondary, #888);
  margin-top: 0.2em;
}
.rules-card {
  background: var(--bg-secondary, #fff);
  border-radius: 18px;
  box-shadow: 0 2px 16px 0 rgba(0,0,0,0.08);
  padding: 1.5em 1.2em;
  display: flex;
  flex-direction: column;
  gap: 0.7em;
  position: relative;
}
.rules-card-icon {
  position: absolute;
  top: 1.1em;
  right: 1.1em;
  font-size: 1.5em;
  opacity: 0.7;
}
.rules-cards-row {
  display: flex;
  flex-direction: row;
  gap: 1.2em;
  justify-content: center;
}
.rules-card ul, .rules-card ol {
  margin: 0.5em 0 0.5em 1.2em;
}
.rules-card h3 {
  margin-top: 0.2em;
  margin-bottom: 0.2em;
}
.directions-grid-visual {
  display: grid;
  grid-template-columns: repeat(3, 48px);
  grid-template-rows: repeat(3, 48px);
  gap: 6px;
  justify-content: center;
  margin: 1.2em 0;
  font-family: 'M PLUS Rounded 1c', sans-serif;
}
.dir-btn-visual {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3em;
  border-radius: 10px;
  background: var(--control-bg, #f0e8f2);
  color: var(--text-primary, #442c2e);
  box-shadow: 0 1px 2px rgba(0,0,0,0.07);
  border: 1px solid var(--border-color, rgba(233, 84, 32, 0.3));
}
.dir-btn-visual.center-piece {
  font-size: 1.6em;
  background: var(--cell-dark, #e4d5c6);
  color: var(--piece-color, #3a2a22);
  border: none;
}
.pro-mode-title {
  margin-top: 1.5rem;
  padding-top: 0.7rem;
  border-top: 2px solid var(--border-color, rgba(233, 84, 32, 0.3));
  color: var(--text-accent, #e95420);
}
@media (max-width: 600px) {
  .rules-cards-row {
    flex-direction: column;
    gap: 1.2em;
  }
  .rules-card {
    padding: 1.1em 0.7em;
  }
  .rules-header h1 {
    font-size: 1.3em;
  }
}
</style> 