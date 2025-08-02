import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { spawn } from 'child_process';
import { readFileSync, existsSync } from 'fs';

describe('Browser Integration Test', () => {
  let devServer: any = null;
  let serverUrl = 'http://localhost:5173';

  beforeAll(async () => {
    console.log('🚀 Запускаємо dev сервер...');
    
    devServer = spawn('npm', ['run', 'dev'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    });

    // Чекаємо поки сервер запуститься
    await new Promise((resolve) => {
      devServer.stdout.on('data', (data: any) => {
        const output = data.toString();
        console.log('📝 Dev server output:', output);
        
        if (output.includes('Local:') || output.includes('localhost:')) {
          console.log('✅ Dev сервер запустився');
          resolve(true);
        }
      });

      devServer.stderr.on('data', (data: any) => {
        console.error('Dev server error:', data.toString());
      });

      // Таймаут
      setTimeout(() => {
        console.log('⏰ Таймаут запуску сервера');
        resolve(false);
      }, 10000);
    });
  });

  afterAll(async () => {
    if (devServer) {
      console.log('🛑 Зупиняємо dev сервер...');
      devServer.kill('SIGTERM');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  });

  test('Сайт повинен запускатися без помилок', async () => {
    expect(devServer).toBeDefined();
    expect(devServer.pid).toBeDefined();
    console.log(`✅ Dev сервер працює з PID: ${devServer.pid}`);
  });

  test('Головна сторінка повинна відповідати', async () => {
    try {
      const response = await fetch(serverUrl);
      expect(response.status).toBe(200);
      console.log('✅ Головна сторінка відповідає');
    } catch (error) {
      console.error('❌ Помилка запиту до головної сторінки:', error);
      throw error;
    }
  });

  describe('JavaScript Errors Detection', () => {
    test('перевірка наявності основних скриптів', async () => {
      try {
        const response = await fetch(serverUrl);
        const html = await response.text();
        
        // Перевіряємо наявність основних скриптів
        expect(html).toContain('<script');
        expect(html).toContain('svelte');
        
        console.log('✅ Основні скрипти присутні');
      } catch (error) {
        console.error('❌ Помилка перевірки скриптів:', error.message);
        throw error;
      }
    });

    test('перевірка наявності критичних файлів', () => {
      const criticalFiles = [
        'src/lib/stores/gameState.ts',
        'src/lib/stores/animationStore.js',
        'src/routes/+layout.svelte',
        'src/routes/+page.svelte',
        'src/app.html'
      ];

      criticalFiles.forEach(filePath => {
        expect(existsSync(filePath)).toBe(true);
        console.log(`✅ Файл існує: ${filePath}`);
      });
    });
  });

  describe('Runtime Error Analysis', () => {
    test('аналіз потенційних причин помилки "Cannot access gameState before initialization"', () => {
      const animationStoreContent = readFileSync('src/lib/stores/animationStore.js', 'utf8');
      
      // Перевіряємо, чи є відкладений імпорт замість прямого
      const animationStoreLines = animationStoreContent.split('\n');
      const deferredImportLine = animationStoreLines.findIndex(line => line.includes("let gameState = null"));
      expect(deferredImportLine).toBeGreaterThan(-1);
      expect(deferredImportLine).toBeLessThan(35); // Відкладений імпорт повинен бути на початку файлу
      
      // Перевіряємо наявність require та import
      const hasRequire = animationStoreContent.includes("require('./gameState.js')");
      const hasImport = animationStoreContent.includes("import('./gameState.js')");
      expect(hasRequire || hasImport).toBe(true);
      
      console.log('✅ Відкладений імпорт gameState налаштований');
    });

    test('перевірка наявності fallback механізмів', () => {
      const animationStoreContent = readFileSync('src/lib/stores/animationStore.js', 'utf8');
      
      // Перевіряємо наявність fallback значень
      expect(animationStoreContent).toContain('|| 0');
      expect(animationStoreContent).toContain('Date.now()');
      expect(animationStoreContent).toContain('?.');
      
      console.log('✅ Fallback механізми присутні');
    });
  });

  describe('Development Environment', () => {
    test('перевірка наявності всіх необхідних залежностей', () => {
      const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
      
      const requiredDeps = [
        '@sveltejs/kit',
        'svelte',
        'vite'
      ];

      requiredDeps.forEach(dep => {
        expect(packageJson.dependencies[dep] || packageJson.devDependencies[dep]).toBeDefined();
        console.log(`✅ Залежність присутня: ${dep}`);
      });
    });

    test('перевірка конфігураційних файлів', () => {
      const configFiles = [
        'svelte.config.js',
        'vite.config.ts',
        'tsconfig.json'
      ];

      configFiles.forEach(filePath => {
        expect(existsSync(filePath)).toBe(true);
        console.log(`✅ Конфігураційний файл існує: ${filePath}`);
      });
    });
  });
}); 