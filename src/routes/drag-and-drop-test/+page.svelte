<script lang="ts">
  import ColorPicker from '$lib/components/local-setup/ColorPicker.svelte';
  import { logService } from '$lib/services/logService.js';
  
  let testColor = '#e63946';
  
  function handleColorChange(event: CustomEvent<{ value: string }>) {
    logService.ui('Test: Color changed to', event.detail.value);
    testColor = event.detail.value;
  }
</script>

<div style="padding: 20px; background: #f0f0f0; min-height: 100vh;">
  <h1>Тест ColorPicker</h1>
  
  <div style="margin: 20px 0;">
    <h3>Поточний колір: {testColor}</h3>
    <div style="width: 50px; height: 50px; background-color: {testColor}; border: 2px solid #333; border-radius: 50%; margin: 10px 0;"></div>
  </div>
  
  <ColorPicker 
    value={testColor}
    on:change={handleColorChange}
  />
  
  <div style="margin-top: 20px;">
    <button on:click={() => testColor = '#ff0000'}>Встановити червоний</button>
    <button on:click={() => testColor = '#00ff00'}>Встановити зелений</button>
    <button on:click={() => testColor = '#0000ff'}>Встановити синій</button>
  </div>
</div> 