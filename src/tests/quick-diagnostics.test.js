import { describe, test, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('Quick Site Diagnostics', () => {
  test('Перевірка критичних файлів проекту', () => {
    const criticalFiles = [
      'package.json',
      'vite.config.ts',
      'svelte.config.js',
      'tsconfig.json',
      'src/app.html',
      'src/routes/+page.svelte',
      'src/lib/stores/gameState.ts'
    ];

    const missingFiles = [];
    
    for (const file of criticalFiles) {
      if (!existsSync(file)) {
        missingFiles.push(file);
      }
    }

    if (missingFiles.length > 0) {
      console.error('❌ Відсутні критичні файли:', missingFiles);
      throw new Error(`Відсутні файли: ${missingFiles.join(', ')}`);
    }

    console.log('✅ Всі критичні файли присутні');
  });

  test('Перевірка package.json', () => {
    try {
      const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
      
      // Перевіряємо основні поля
      expect(packageJson.name).toBeDefined();
      expect(packageJson.version).toBeDefined();
      expect(packageJson.scripts).toBeDefined();
      expect(packageJson.scripts.dev).toBeDefined();
      
      // Перевіряємо критичні залежності
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      const criticalDeps = ['svelte', '@sveltejs/kit', 'vite'];
      
      for (const dep of criticalDeps) {
        if (!deps[dep]) {
          throw new Error(`Відсутня критична залежність: ${dep}`);
        }
      }
      
      console.log('✅ package.json правильний');
    } catch (error) {
      console.error('❌ Помилка package.json:', error.message);
      throw error;
    }
  });

  test('Перевірка конфігурації Vite', () => {
    try {
      const viteConfig = readFileSync('vite.config.ts', 'utf8');
      
      // Перевіряємо основні елементи
      expect(viteConfig).toContain('sveltekit');
      expect(viteConfig).toContain('defineConfig');
      
      console.log('✅ Vite конфігурація правильна');
    } catch (error) {
      console.error('❌ Помилка Vite конфігурації:', error.message);
      throw error;
    }
  });

  test('Перевірка конфігурації Svelte', () => {
    try {
      const svelteConfig = readFileSync('svelte.config.js', 'utf8');
      
      // Перевіряємо основні елементи
      expect(svelteConfig).toContain('adapter');
      
      console.log('✅ Svelte конфігурація правильна');
    } catch (error) {
      console.error('❌ Помилка Svelte конфігурації:', error.message);
      throw error;
    }
  });

  test('Перевірка структури src/', () => {
    const requiredDirs = [
      'src',
      'src/routes',
      'src/lib',
      'src/lib/stores',
      'src/lib/services'
    ];

    const missingDirs = [];
    
    for (const dir of requiredDirs) {
      if (!existsSync(dir)) {
        missingDirs.push(dir);
      }
    }

    if (missingDirs.length > 0) {
      console.error('❌ Відсутні критичні директорії:', missingDirs);
      throw new Error(`Відсутні директорії: ${missingDirs.join(', ')}`);
    }

    console.log('✅ Структура src/ правильна');
  });

  test('Перевірка основних компонентів', () => {
    const criticalComponents = [
      'src/routes/+layout.svelte',
      'src/routes/+page.svelte',
      'src/lib/stores/gameState.ts',
      'src/lib/stores/animationStore.js',
      'src/lib/services/gameLogicService.ts'
    ];

    const missingComponents = [];
    
    for (const component of criticalComponents) {
      if (!existsSync(component)) {
        missingComponents.push(component);
      }
    }

    if (missingComponents.length > 0) {
      console.error('❌ Відсутні критичні компоненти:', missingComponents);
      throw new Error(`Відсутні компоненти: ${missingComponents.join(', ')}`);
    }

    console.log('✅ Всі критичні компоненти присутні');
  });

  test('Перевірка синтаксису TypeScript файлів', () => {
    const tsFiles = [
      'src/lib/services/gameLogicService.ts',
      'src/lib/stores/derivedState.ts'
    ];

    for (const file of tsFiles) {
      if (existsSync(file)) {
        try {
          const content = readFileSync(file, 'utf8');
          // Базова перевірка синтаксису
          expect(content).toContain('import');
          expect(content).toContain('export');
          console.log(`✅ TypeScript файл ${file} читається`);
        } catch (error) {
          console.error(`❌ Помилка читання ${file}:`, error.message);
          throw error;
        }
      }
    }
  });

  test('Перевірка JavaScript файлів', () => {
    const jsFiles = [
      'src/lib/stores/animationStore.js',
      'src/lib/gameOrchestrator.js'
    ];

    for (const file of jsFiles) {
      if (existsSync(file)) {
        try {
          const content = readFileSync(file, 'utf8');
          // Базова перевірка синтаксису
          expect(content).toContain('import');
          expect(content).toContain('export');
          console.log(`✅ JavaScript файл ${file} читається`);
        } catch (error) {
          console.error(`❌ Помилка читання ${file}:`, error.message);
          throw error;
        }
      }
    }
  });
});

describe('Runtime Diagnostics', () => {
  test('Перевірка доступності глобальних об\'єктів', () => {
    // Перевіряємо чи доступні необхідні глобальні об'єкти
    expect(typeof fetch).toBe('function');
    expect(typeof console).toBe('object');
    expect(typeof process).toBe('object');
    
    console.log('✅ Глобальні об\'єкти доступні');
  });

  test('Перевірка Node.js модулів', () => {
    const { readFileSync, existsSync } = require('fs');
    const { join } = require('path');
    
    expect(typeof readFileSync).toBe('function');
    expect(typeof existsSync).toBe('function');
    expect(typeof join).toBe('function');
    
    console.log('✅ Node.js модулі доступні');
  });
}); 