<script>
  export let x = 0;
  export let y = 0;
  export let content = '';
</script>

<div class="tooltip" style="left: {x}px; top: {y}px;">
  {@html content}
</div>

<style>
  :global(.hotkey-kbd) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 20px;
    height: 20px;
    padding: 0 6px;
    border: 1px solid var(--border-color, #444);
    border-radius: 4px;
    background: var(--bg-primary, #1e1e1e);
    font-weight: bold;
    margin-left: 8px;
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
    white-space: nowrap;
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