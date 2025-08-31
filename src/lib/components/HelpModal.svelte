<script>
  import { modalService } from '$lib/services/modalService';
  import { onMount } from 'svelte';

  let content = '';

  onMount(async () => {
    // This is not ideal, but for now we will fetch the content of the markdown file
    // In the future, this should be handled by a proper CMS or a dedicated content store
    const response = await fetch('/docs/user-guide/keyboard-shortcuts.md');
    content = await response.text();
  });

</script>

<div class="help-modal-content">
  <pre>{content}</pre>
</div>

<style>
  .help-modal-content {
    padding: 1rem;
    white-space: pre-wrap;
  }
</style>
