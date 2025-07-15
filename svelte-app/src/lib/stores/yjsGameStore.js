import { writable } from 'svelte/store';
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';

// Створюємо Yjs-документ та підключаємося до кімнати
export function createYjsGameStore(roomName = 'default-room', mapKey = 'game') {
  const ydoc = new Y.Doc();
  const provider = new WebrtcProvider(roomName, ydoc);
  const ymap = ydoc.getMap(mapKey);

  // Svelte store для реактивності
  const { subscribe, set, update } = writable(ymap.toJSON());

  // Слухаємо зміни у Yjs-стані
  ymap.observeDeep(() => {
    set(ymap.toJSON());
  });

  // Оновлення стану (синхронізується для всіх peer)
  function setState(newState) {
    Object.entries(newState).forEach(([k, v]) => ymap.set(k, v));
  }

  // Очистити стан
  function clearState() {
    ymap.clear();
  }

  return {
    subscribe,
    setState,
    clearState,
    ydoc,
    provider,
    ymap
  };
}

// Приклад використання у компоненті:
// import { createYjsGameStore } from '$stores/yjsGameStore';
// const gameStore = createYjsGameStore('room-123');
// $gameStore — реактивний стан, gameStore.setState({ ... }) — оновлення 