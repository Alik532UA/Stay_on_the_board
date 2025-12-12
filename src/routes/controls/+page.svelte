<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';

  onMount(() => {
    // Redirect to the new location (Settings -> Hotkeys tab)
    goto(`${base}/settings?tab=hotkeys`);
  });
</script>

<div style="display: flex; justify-content: center; align-items: center; height: 100vh; color: var(--text-primary);">
  <p>Redirecting to settings...</p>
</div>