<script>
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();
  function reload() {
    dispatch('reload');
  }
</script>

<div class="update-notice">
  <div class="text-container">
    <p class="title">Доступне оновлення!</p>
    <p class="description">Щоб уникнути помилок через старий кеш, будь ласка, перезавантажте гру.</p>
  </div>
  <button on:click={reload}>Оновити</button>
</div>

<style>
.update-notice {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #2c001e;
  color: white;
  padding: 20px 24px;
  border-radius: 16px;
  box-shadow: 0 6px 24px rgba(0,0,0,0.5);
  z-index: 10001;
  border: 1px solid #e95420;
  animation: slide-in 0.5s ease-out;
  width: 90vw;
  max-width: 380px;
  box-sizing: border-box;
  text-align: center;
}

@keyframes slide-in {
  from { transform: translate(-50%, 120px); opacity: 0; }
  to { transform: translate(-50%, 0); opacity: 1; }
}

.text-container {
  margin-bottom: 16px;
}

.title {
  margin: 0 0 8px 0;
  font-weight: 700;
  font-size: 1.2em;
}

.description {
  margin: 0;
  font-size: 0.95em;
  opacity: 0.9;
  line-height: 1.5;
}

button {
  background: #e95420;
  color: white;
  border: none;
  border-radius: 12px;
  padding: 12px 24px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.2s;
  width: 100%;
  font-size: 1.05em;
}

button:hover {
  background: #dd4814;
  transform: scale(1.03);
}
</style> 