<script>
  import FloatingCloseButton from '$lib/components/FloatingCloseButton.svelte';
  import { _ } from 'svelte-i18n';
</script>

<FloatingCloseButton />

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

<style>
  .directions-grid-visual {
    display: grid;
    grid-template-columns: repeat(3, 60px);
    grid-template-rows: repeat(3, 60px);
    gap: 10px;
    justify-content: center;
    margin: 1.5em 0;
    font-family: 'M PLUS Rounded 1c', sans-serif;
  }

  .dir-btn-visual {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.8em;
    border-radius: 12px;
    background: var(--control-bg, #f0e8f2);
    color: var(--text-primary, #442c2e);
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    border: 1px solid var(--border-color, rgba(233, 84, 32, 0.5));
  }

  .dir-btn-visual.center-piece {
    font-size: 2.2em;
    background: var(--cell-dark, #e4d5c6);
    color: var(--piece-color, #3a2a22);
    border: none;
  }
</style> 