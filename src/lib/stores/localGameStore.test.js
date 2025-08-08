import { localGameStore } from './localGameStore.js';

// Тестова функція для перевірки функціональності сховища
function testLocalGameStore() {
  console.log('🧪 Тестування localGameStore...');

  // Підписуємося на зміни в store
  const unsubscribe = localGameStore.subscribe(state => {
    console.log('📊 Поточний стан:', state);
  });

  // Тест 1: Перевірка початкового стану
  console.log('\n✅ Тест 1: Початковий стан');
  localGameStore.subscribe(state => {
    console.log('Гравці:', state.players.length);
    console.log('Налаштування:', state.settings);
  })();

  // Тест 2: Додавання гравця
  console.log('\n✅ Тест 2: Додавання гравця');
  localGameStore.addPlayer();

  // Тест 3: Оновлення гравця
  console.log('\n✅ Тест 3: Оновлення гравця');
  localGameStore.subscribe(state => {
    if (state.players.length > 0) {
      const firstPlayerId = state.players[0].id;
      localGameStore.updatePlayer(firstPlayerId, { name: 'Оновлений гравець' });
    }
  })();

  // Тест 4: Оновлення налаштувань
  console.log('\n✅ Тест 4: Оновлення налаштувань');
  localGameStore.updateSettings({ boardSize: 6, blockModeEnabled: false });

  // Тест 5: Скидання store
  console.log('\n✅ Тест 5: Скидання store');
  setTimeout(() => {
    localGameStore.resetStore();
    console.log('Store скинуто до початкового стану');
  }, 1000);

  // Відписуємося через 3 секунди
  setTimeout(() => {
    unsubscribe();
    console.log('\n🏁 Тестування завершено');
  }, 3000);
}

// Експортуємо тестову функцію
export { testLocalGameStore };

// Запускаємо тест, якщо файл виконується напряму
if (typeof window !== 'undefined') {
  // В браузері можна запустити через консоль: testLocalGameStore()
  /** @type {any} */ (window).testLocalGameStore = testLocalGameStore;
} 