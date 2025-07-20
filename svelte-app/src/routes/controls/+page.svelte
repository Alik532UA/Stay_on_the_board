<script>
  import FloatingBackButton from '$lib/components/FloatingBackButton.svelte';
  import { _ } from 'svelte-i18n';
</script>

<FloatingBackButton />

<h1>{$_('controlsPage.title')}</h1>

<h2>{$_('controlsPage.mainMovement')}</h2>
<ul>
  <li><b>7</b>: {$_('controlsPage.upLeft')} (↖)</li>
  <li><b>8</b>: {$_('controlsPage.up')} (↑)</li>
  <li><b>9</b>: {$_('controlsPage.upRight')} (↗)</li>
  <li><b>4</b>: {$_('controlsPage.left')} (←)</li>
  <li><b>6</b>: {$_('controlsPage.right')} (→)</li>
  <li><b>1</b>: {$_('controlsPage.downLeft')} (↙) <em>{$_('controlsPage.downLeftNote')}</em></li>
  <li><b>2</b>: {$_('controlsPage.down')} (↓)</li>
  <li><b>3</b>: {$_('controlsPage.downRight')} (↘)</li>
</ul>

<h2>{$_('controlsPage.altMovement')}</h2>
<ul>
  <li><b>Q</b>: {$_('controlsPage.upLeft')} (↖)</li>
  <li><b>W</b>: {$_('controlsPage.up')} (↑)</li>
  <li><b>E</b>: {$_('controlsPage.upRight')} (↗)</li>
  <li><b>A</b>: {$_('controlsPage.left')} (←)</li>
  <li><b>D</b>: {$_('controlsPage.right')} (→)</li>
  <li><b>Z</b>: {$_('controlsPage.downLeft')} (↙)</li>
  <li><b>S</b> / <b>X</b>: {$_('controlsPage.down')} (↓)</li>
  <li><b>C</b>: {$_('controlsPage.downRight')} (↘)</li>
</ul>

<h2>{$_('controlsPage.gameActions')}</h2>
<ul>
  <li><b>Enter</b> / <b>Space</b> / <b>NumPad 5</b>: {$_('controlsPage.confirmMove')}</li>
  <li><b>Backspace</b> / <b>Num .</b> / <b>N</b>: {$_('controlsPage.noMoves')}</li>
</ul>

<h2>{$_('controlsPage.gameSettings')}</h2>
<ul>
  <li><b>NumPad *</b>: {$_('controlsPage.toggleBlockMode')}</li>
  <li><b>NumPad /</b>: {$_('controlsPage.toggleBoardVisibility')}</li>
  <li><b>NumPad +</b> / <b>=</b>: {$_('controlsPage.increaseBoard')}</li>
  <li><b>NumPad -</b> / <b>-</b>: {$_('controlsPage.decreaseBoard')}</li>
  <li><b>V</b>: {$_('controlsPage.toggleSpeech')}</li>
</ul> 