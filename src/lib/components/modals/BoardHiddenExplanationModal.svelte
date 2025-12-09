<script lang="ts">
  import { _ } from 'svelte-i18n';
</script>

<div class="modal-content-wrapper">
    <p>{$_('modal.boardHiddenExplanation.p1')}</p>
    <p>{$_('modal.boardHiddenExplanation.p2')}</p>
    <p>{$_('modal.boardHiddenExplanation.p3')}</p>
</div>

<style>
    .modal-content-wrapper {
        padding: 1rem;
        text-align: center;
    }
</style>
