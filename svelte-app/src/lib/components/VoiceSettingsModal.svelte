<script>
  export let close = () => {};
</script>

<div class="voice-settings-modal">
  <h2>Налаштування голосу</h2>
  <button on:click={close}>Закрити</button>
  <!-- TODO: Додати налаштування голосу -->
</div>

<style>
.voice-settings-modal {
  padding: 2em;
  background: rgba(255,255,255,0.9);
  border-radius: 1em;
  box-shadow: 0 2px 16px rgba(0,0,0,0.15);
  min-width: 300px;
  min-height: 150px;
  text-align: center;
}
button {
  margin-top: 1.5em;
}
</style> 