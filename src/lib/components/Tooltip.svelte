<script lang="ts">
  export let x = 0;
  export let y = 0;
  export let content = '';

  let tooltipNode: HTMLElement;
  let adjustedX = 0;
  let adjustedY = 0;

  $: if (tooltipNode && content && typeof window !== 'undefined') {
    const width = tooltipNode.offsetWidth;
    const height = tooltipNode.offsetHeight;
    const safetyMargin = 10;

    let newX = x;
    let newY = y;

    if (newX + width + safetyMargin > window.innerWidth) {
        newX = window.innerWidth - width - safetyMargin;
    }
    if (newY + height + safetyMargin > window.innerHeight) {
        newY = window.innerHeight - height - safetyMargin;
    }
    if (newX < safetyMargin) {
        newX = safetyMargin;
    }
    if (newY < safetyMargin) {
        newY = safetyMargin;
    }
    adjustedX = newX;
    adjustedY = newY;
  } else {
    adjustedX = x;
    adjustedY = y;
  }

</script>

<div class="tooltip" style="left: {adjustedX}px; top: {adjustedY}px;" bind:this={tooltipNode}>
  {@html content}
</div>

<style>
  :global(.tooltip-title) {
    font-weight: bold;
    margin-bottom: 6px; /* Add some space below the title */
    text-align: center;
  }
  :global(.tooltip-divider) {
    border: none;
    border-top: 1px solid var(--border-color, #444);
    margin: 6px 0; /* Add space around the divider */
  }
  :global(.hotkey-title) {
    font-weight: bold;
    margin-bottom: 4px;
    text-align: center;
  }
  :global(.hotkey-item) {
    display: flex;
    justify-content: center;
  }
  :global(.hotkey-item:not(:last-child)) {
    margin-bottom: 4px;
  }
  :global(.hotkey-kbd) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 20px;
    padding: 0 6px;
    border: 1px solid var(--border-color, #444);
    border-radius: 4px;
    background: var(--bg-primary, #1e1e1e);
    font-weight: bold;
  }
  :global(.hotkey-kbd.single-char) {
    width: 20px;
    padding: 0;
  }
  .tooltip {
    position: fixed;
    padding: 8px 12px;
    background: var(--bg-secondary, #2a2a2a);
    color: var(--text-primary, #fff);
    border-radius: var(--unified-border-radius, 12px);
    border: var(--unified-border, 1px solid rgba(255, 255, 255, 0.1));
    box-shadow: var(--unified-shadow, 0 4px 12px rgba(0, 0, 0, 0.2));
    backdrop-filter: var(--unified-backdrop-filter, blur(10px));
    z-index: 10001; /* Higher than modal overlay */
    pointer-events: none; /* Tooltip should not be interactive */
    font-size: 0.9em;
    white-space: pre-line;
    opacity: 0;
    transform: translateY(5px);
    animation: fadeIn 0.2s ease-out forwards;
  }

  @keyframes fadeIn {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>