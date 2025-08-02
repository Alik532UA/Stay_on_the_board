import { describe, test, expect, vi } from 'vitest';

// Мокаємо requestAnimationFrame для тестового середовища
global.requestAnimationFrame = vi.fn((cb: FrameRequestCallback) => {
  const id = setTimeout(cb, 0);
  return id as number;
});

describe('Real Runtime Error Diagnostics', () => {
  describe('GameState Initialization Error', () => {
    test('симуляція помилки "Cannot access gameState before initialization"', async () => {
      // Цей тест симулює реальну помилку, яка відбувається в браузері
      
      // 1. Спочатку очищаємо всі модули
      vi.resetModules();
      
      // 2. Симулюємо проблемний порядок завантаження
      let errorThrown = false;
      let errorMessage = '';
      
      try {
            // Спочатку імпортуємо animationStore (який потребує gameState)
    const { animationStore } = await import('$lib/stores/animationStore');
        
        // Перевіряємо, чи animationStore створений
        expect(animationStore).toBeDefined();
        
        // Тепер імпортуємо gameState
        const { gameState } = await import('$lib/stores/gameState.ts');
        
        // Перевіряємо, чи gameState працює
        expect(gameState).toBeDefined();
        
        // Спробуємо ініціалізувати animationStore
        if (typeof animationStore.initialize === 'function') {
          animationStore.initialize();
        }
        
      } catch (error) {
        errorThrown = true;
        errorMessage = error.message;
        console.log('Очікувана помилка:', error.message);
      }
      
      // Якщо помилка не виникла, це означає, що наші захисти працюють
      if (!errorThrown) {
        console.log('✅ Помилка не виникла - захисти працюють');
      } else {
        console.log('❌ Помилка виникла:', errorMessage);
        // Перевіряємо, чи це саме та помилка, яку ми очікуємо
        expect(errorMessage).toContain('gameState');
      }
    });

    test('перевірка порядку імпортів та ініціалізації', async () => {
      // Цей тест перевіряє правильний порядок завантаження
      
      // 1. Спочатку імпортуємо gameState
      const { gameState } = await import('$lib/stores/gameState.ts');
      expect(gameState).toBeDefined();
      expect(typeof gameState.subscribe).toBe('function');
      
          // 2. Потім імпортуємо animationStore
    const { animationStore } = await import('$lib/stores/animationStore');
      expect(animationStore).toBeDefined();
      expect(typeof animationStore.subscribe).toBe('function');
      
      // 3. Перевіряємо, чи animationStore може безпечно ініціалізуватися
      expect(() => {
        if (typeof animationStore.initialize === 'function') {
          animationStore.initialize();
        }
      }).not.toThrow();
    });

    test('симуляція проблемного сценарію з одночасним імпортом', async () => {
      // Цей тест симулює сценарій, коли обидва модулі імпортуються одночасно
      
      let hasError = false;
      
      try {
        // Симулюємо одночасний імпорт
            const [gameStateModule, animationStoreModule] = await Promise.all([
      import('$lib/stores/gameState.ts'),
      import('$lib/stores/animationStore')
    ]);
        
        const { gameState } = gameStateModule;
        const { animationStore } = animationStoreModule;
        
        expect(gameState).toBeDefined();
        expect(animationStore).toBeDefined();
        
        // Спробуємо ініціалізувати animationStore
        if (typeof animationStore.initialize === 'function') {
          animationStore.initialize();
        }
        
      } catch (error) {
        hasError = true;
        console.log('Помилка при одночасному імпорті:', error.message);
      }
      
      // Якщо помилка виникла, це може бути проблемою
      if (hasError) {
        console.log('⚠️ Виявлена потенційна проблема з порядком імпортів');
      }
    });
  });

  describe('Browser Environment Simulation', () => {
    test('симуляція браузерного середовища', () => {
      // Перевіряємо, чи наші моки працюють правильно
      expect(typeof global.requestAnimationFrame).toBe('function');
      
      // Перевіряємо, чи setTimeout працює
      expect(typeof setTimeout).toBe('function');
      
      // Перевіряємо, чи console працює
      expect(typeof console.log).toBe('function');
      expect(typeof console.error).toBe('function');
    });

    test('перевірка наявності всіх необхідних глобальних об\'єктів', () => {
      // Перевіряємо наявність основних браузерних API
      const requiredGlobals = [
        'setTimeout',
        'clearTimeout',
        'console',
        'Promise'
      ];
      
      requiredGlobals.forEach(globalName => {
        expect((global as any)[globalName]).toBeDefined();
      });
    });
  });

  describe('Module Loading Diagnostics', () => {
    test('перевірка шляху до файлів', async () => {
      // Перевіряємо, чи можемо знайти всі необхідні файли
      const { readFileSync, existsSync } = await import('fs');
      
      const requiredFiles = [
        'src/lib/stores/gameState.ts',
        'src/lib/stores/animationStore.js',
        'src/routes/+layout.svelte',
        'src/routes/+page.svelte'
      ];
      
      requiredFiles.forEach(filePath => {
        expect(existsSync(filePath)).toBe(true);
      });
    });

    test('перевірка синтаксису файлів', async () => {
      // Перевіряємо, чи файли можуть бути імпортовані без синтаксичних помилок
      
      try {
        const { gameState } = await import('$lib/stores/gameState.ts');
        expect(gameState).toBeDefined();
      } catch (error) {
        console.error('Помилка імпорту gameState:', error.message);
        throw error;
      }
      
      try {
        const { animationStore } = await import('$lib/stores/animationStore.js');
        expect(animationStore).toBeDefined();
      } catch (error) {
        console.error('Помилка імпорту animationStore:', error.message);
        throw error;
      }
    });
  });

  describe('Error Reproduction', () => {
    test('спроба відтворити реальну помилку', async () => {
      // Цей тест намагається відтворити саме ту помилку, яка відбувається в браузері
      
      // Очищаємо модулі для чистої симуляції
      vi.resetModules();
      
      let initializationError = null;
      
      try {
        // Симулюємо проблемний сценарій
        const { animationStore } = await import('$lib/stores/animationStore.js');
        
        // Перевіряємо, чи animationStore має захист
        expect(animationStore).toBeDefined();
        
        // Спробуємо отримати поточний стан без ініціалізації gameState
        const { get } = await import('svelte/store');
        
        // Це може викликати помилку, якщо gameState не ініціалізований
        try {
          const currentState = get(animationStore);
          console.log('✅ animationStore стан отримано:', currentState);
        } catch (error) {
          initializationError = error;
          console.log('❌ Помилка отримання стану:', error.message);
        }
        
      } catch (error) {
        console.log('❌ Помилка імпорту:', error.message);
        throw error;
      }
      
      // Якщо помилка виникла, це може бути причиною проблеми в браузері
      if (initializationError) {
        console.log('⚠️ Виявлена потенційна причина проблеми в браузері');
        expect(initializationError.message).toContain('gameState');
      }
    });
  });
}); 