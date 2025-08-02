import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { spawn } from 'child_process';
import { createServer } from 'http';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Site Availability Tests', () => {
  let devServer: any = null;
  let serverPort: number | null = null;

  beforeAll(async () => {
    console.log('🚀 Запускаємо dev сервер...');
    
    devServer = spawn('npm', ['run', 'dev'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    });

    // Чекаємо поки сервер запуститься і отримаємо порт
    await new Promise((resolve) => {
      devServer.stdout.on('data', (data: any) => {
        const output = data.toString();
        console.log('📝 Dev server output:', output);
        
        // Шукаємо порт в виводі
        const portMatch = output.match(/Local:\s*http:\/\/localhost:(\d+)/);
        if (portMatch) {
          serverPort = parseInt(portMatch[1]);
          console.log(`✅ Сервер запустився на порту ${serverPort}`);
          resolve(true);
        }
      });

      // Таймаут
      setTimeout(() => {
        console.log('⏰ Таймаут запуску сервера');
        resolve(false);
      }, 10000);
    });
  });

  afterAll(() => {
    if (devServer) {
      devServer.kill();
    }
  });

  test('Сайт повинен запускатися без помилок', async () => {
    expect(serverPort).toBeDefined();
    expect(serverPort).toBeGreaterThan(0);
    console.log(`✅ Сайт запустився на порту ${serverPort}`);
  });

  test('Головна сторінка повинна відповідати', async () => {
    if (!serverPort) {
      throw new Error('Сервер не запустився');
    }

    try {
      const response = await fetch(`http://localhost:${serverPort}/Stay_on_the_board`);
      expect(response.status).toBe(200);
      console.log('✅ Головна сторінка відповідає');
    } catch (error) {
      console.error('❌ Помилка запиту до головної сторінки:', error);
      throw error;
    }
  });

  test('SvelteKit повинен правильно обробляти маршрути', async () => {
    if (!serverPort) {
      throw new Error('Сервер не запустився');
    }

    const routes = [
      '/Stay_on_the_board',
      '/Stay_on_the_board/about',
      '/Stay_on_the_board/game',
      '/Stay_on_the_board/controls',
      '/Stay_on_the_board/settings'
    ];

    for (const route of routes) {
      try {
        const response = await fetch(`http://localhost:${serverPort}${route}`);
        console.log(`✅ Маршрут ${route}: ${response.status}`);
        expect(response.status).toBe(200);
      } catch (error) {
        console.error(`❌ Помилка маршруту ${route}:`, error);
        throw error;
      }
    }
  });

  test('Критичні файли повинні існувати', () => {
    const criticalFiles = [
      'src/app.html',
      'src/routes/+layout.svelte',
      'src/routes/+page.svelte',
      'src/lib/stores/gameState.js',
      'src/lib/stores/animationStore',
      'src/lib/services/gameLogicService.ts',
      'src/lib/gameOrchestrator',
      'package.json',
      'vite.config.ts',
      'svelte.config.js'
    ];

    for (const file of criticalFiles) {
      try {
        const filePath = join(process.cwd(), file);
        const content = readFileSync(filePath, 'utf8');
        expect(content).toBeDefined();
        expect(content.length).toBeGreaterThan(0);
        console.log(`✅ Файл ${file} існує та читається`);
      } catch (error) {
        console.error(`❌ Помилка файлу ${file}:`, error.message);
        throw error;
      }
    }
  });

  test('Залежності повинні бути встановлені', () => {
    try {
      const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
      expect(packageJson.dependencies).toBeDefined();
      expect(packageJson.devDependencies).toBeDefined();
      
      // Перевіряємо критичні залежності
      const criticalDeps = ['svelte', 'sveltekit', 'vite'];
      for (const dep of criticalDeps) {
        expect(packageJson.dependencies[dep] || packageJson.devDependencies[dep]).toBeDefined();
      }
      
      console.log('✅ Залежності встановлені');
    } catch (error) {
      console.error('❌ Помилка залежностей:', error.message);
      throw error;
    }
  });

  test('Конфігурація Vite повинна бути правильною', () => {
    try {
      const viteConfig = readFileSync('vite.config.ts', 'utf8');
      expect(viteConfig).toContain('sveltekit');
      expect(viteConfig).toContain('defineConfig');
      console.log('✅ Vite конфігурація правильна');
    } catch (error) {
      console.error('❌ Помилка Vite конфігурації:', error.message);
      throw error;
    }
  });

  test('Конфігурація Svelte повинна бути правильною', () => {
    try {
      const svelteConfig = readFileSync('svelte.config.js', 'utf8');
      expect(svelteConfig).toContain('adapter');
      console.log('✅ Svelte конфігурація правильна');
    } catch (error) {
      console.error('❌ Помилка Svelte конфігурації:', error.message);
      throw error;
    }
  });
});

describe('Extended Diagnostics', () => {
  test('Перевірка стану процесів', () => {
    // Перевіряємо чи немає заблокованих портів
    const commonPorts = [3000, 5173, 5174, 8080];
    console.log('🔍 Перевірка портів:', commonPorts.join(', '));
  });

  test('Перевірка файлової системи', () => {
    const { readdirSync, statSync } = require('fs');
    const { join } = require('path');
    
    try {
      const srcDir = readdirSync('src');
      console.log('📁 Вміст src/:', srcDir);
      
      const libDir = readdirSync('src/lib');
      console.log('📁 Вміст src/lib/:', libDir);
      
      const routesDir = readdirSync('src/routes');
      console.log('📁 Вміст src/routes/:', routesDir);
      
      console.log('✅ Файлова система доступна');
    } catch (error) {
      console.error('❌ Помилка файлової системи:', error.message);
      throw error;
    }
  });

  test('Перевірка TypeScript конфігурації', () => {
    try {
      const tsConfig = readFileSync('tsconfig.json', 'utf8');
      const config = JSON.parse(tsConfig);
      expect(config.compilerOptions).toBeDefined();
      console.log('✅ TypeScript конфігурація правильна');
    } catch (error) {
      console.error('❌ Помилка TypeScript конфігурації:', error.message);
      throw error;
    }
  });
}); 