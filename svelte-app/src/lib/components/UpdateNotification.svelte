<script>
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  function reload() {
    dispatch('reload');
  }
</script>

<div class="update-notice">
  <p>Доступна нова версія гри!</p>
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
    padding: 12px 20px;
    border-radius: 12px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.4);
    display: flex;
    align-items: center;
    gap: 16px;
    z-index: 10001; /* Вище за все інше */
    border: 1px solid #e95420;
    animation: slide-in 0.5s ease-out;
  }

  @keyframes slide-in {
    from { transform: translate(-50%, 100px); opacity: 0; }
    to { transform: translate(-50%, 0); opacity: 1; }
  }

  .update-notice p {
    margin: 0;
    font-weight: 500;
  }

  .update-notice button {
    background: #e95420;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 8px 16px;
    font-weight: bold;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .update-notice button:hover {
    background: #dd4814;
  }
</style> 