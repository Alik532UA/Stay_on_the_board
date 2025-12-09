<script>
  import VoiceSettingsModal from '$lib/components/VoiceSettingsModal.svelte';
  import { closeModal } from '$lib/stores/modalStore.js';
</script>

<VoiceSettingsModal close={closeModal} on:close={closeModal} /> 
