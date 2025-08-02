import { describe, test, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('Basic Site Health Check', () => {
  test('Перевірка основної структури проекту', () => {
    const criticalPaths = [
      'package.json',
      'vite.config.ts',
      'svelte.config.js',
      'tsconfig.json',
      'src/app.html',
      'src/routes/+page.svelte',
      'src/lib/stores/gameState.ts',
      'src/lib/stores/animationStore.js',
      'src/lib/services/gameLogicService.ts'
    ];

    const missingPaths = [];
    
    for (const path of criticalPaths) {
      if (!existsSync(path)) {
        missingPaths.push(path);
      }
    }

    if (missingPaths.length > 0) {
      console.error('❌ Відсутні критичні файли:', missingPaths);
      throw new Error(`Відсутні файли: ${missingPaths.join(', ')}`);
    }

    console.log('✅ Всі критичні файли присутні');
  });

  test('Перевірка package.json та залежностей', () => {
    try {
      const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
      
      // Перевіряємо основні поля
      expect(packageJson.name).toBe('stay-on-the-board');
      expect(packageJson.version).toBeDefined();
      expect(packageJson.scripts).toBeDefined();
      expect(packageJson.scripts.dev).toBe('vite dev');
      expect(packageJson.scripts.build).toBe('vite build');
      
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

  test('Перевірка TypeScript конфігурації', () => {
    try {
      const tsConfig = readFileSync('tsconfig.json', 'utf8');
      // Перевіряємо що файл містить основні елементи
      expect(tsConfig).toContain('compilerOptions');
      expect(tsConfig).toContain('extends');
      
      console.log('✅ TypeScript конфігурація правильна');
    } catch (error) {
      console.error('❌ Помилка TypeScript конфігурації:', error.message);
      throw error;
    }
  });

  test('Перевірка основного HTML файлу', () => {
    try {
      const appHtml = readFileSync('src/app.html', 'utf8');
      
      expect(appHtml).toContain('<!doctype html>');
      expect(appHtml).toContain('<html');
      expect(appHtml).toContain('<head>');
      expect(appHtml).toContain('<body data-sveltekit-preload-data="hover">');
      expect(appHtml).toContain('%sveltekit.body%');
      
      console.log('✅ app.html правильний');
    } catch (error) {
      console.error('❌ Помилка app.html:', error.message);
      throw error;
    }
  });

  test('Перевірка головної сторінки', () => {
    try {
      const mainPage = readFileSync('src/routes/+page.svelte', 'utf8');
      
      expect(mainPage).toContain('<script');
      expect(mainPage.length).toBeGreaterThan(100);
      
      console.log('✅ Головна сторінка правильна');
    } catch (error) {
      console.error('❌ Помилка головної сторінки:', error.message);
      throw error;
    }
  });

  test('Перевірка критичних компонентів гри', () => {
    const gameComponents = [
      'src/lib/stores/gameState.ts',
      'src/lib/stores/animationStore.js',
      'src/lib/services/gameLogicService.ts',
      'src/lib/gameOrchestrator.js'
    ];

    for (const component of gameComponents) {
      try {
        const content = readFileSync(component, 'utf8');
        expect(content).toContain('import');
        expect(content).toContain('export');
        console.log(`✅ Компонент ${component} правильний`);
      } catch (error) {
        console.error(`❌ Помилка компонента ${component}:`, error.message);
        throw error;
      }
    }
  });

  test('Перевірка структури директорій', () => {
    const requiredDirs = [
      'src',
      'src/routes',
      'src/lib',
      'src/lib/stores',
      'src/lib/services',
      'src/lib/components',
      'static'
    ];

    const missingDirs = [];
    
    for (const dir of requiredDirs) {
      if (!existsSync(dir)) {
        missingDirs.push(dir);
      }
    }

    if (missingDirs.length > 0) {
      console.error('❌ Відсутні директорії:', missingDirs);
      throw new Error(`Відсутні директорії: ${missingDirs.join(', ')}`);
    }

    console.log('✅ Структура директорій правильна');
  });
});

describe('Runtime Environment Check', () => {
  test('Перевірка доступності Node.js API', () => {
    expect(typeof process).toBe('object');
    expect(typeof console).toBe('object');
    expect(typeof Buffer).toBe('function');
    
    console.log('✅ Node.js API доступний');
  });

  test('Перевірка доступності файлової системи', () => {
    const { readFileSync, existsSync, statSync } = require('fs');
    
    expect(typeof readFileSync).toBe('function');
    expect(typeof existsSync).toBe('function');
    expect(typeof statSync).toBe('function');
    
    console.log('✅ Файлова система доступна');
  });

  test('Перевірка доступності модулів', () => {
    const { join, resolve, dirname } = require('path');
    
    expect(typeof join).toBe('function');
    expect(typeof resolve).toBe('function');
    expect(typeof dirname).toBe('function');
    
    console.log('✅ Модулі доступні');
  });
}); 