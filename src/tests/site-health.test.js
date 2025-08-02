import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { spawn } from 'child_process';

describe('Site Health Check', () => {
  let devServer: any = null;
  let serverPort: number | null = null;

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
        
        // Шукаємо порт в виводі
        const portMatch = output.match(/Local:\s*http:\/\/localhost:(\d+)/);
        if (portMatch) {
          serverPort = parseInt(portMatch[1]);
          console.log(`✅ Сервер запустився на порту ${serverPort}`);
          resolve(true);
        }
      });

      devServer.stderr.on('data', (data: any) => {
        const error = data.toString();
        console.error('❌ Dev server error:', error);
      });

      devServer.on('error', (error: any) => {
        console.error('❌ Помилка запуску сервера:', error);
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
      console.log('🛑 Зупинка сервера...');
      devServer.kill();
    }
  });

  test('Сервер повинен запуститися', () => {
    expect(serverPort).toBeDefined();
    expect(serverPort).toBeGreaterThan(0);
    console.log(`✅ Сервер працює на порту ${serverPort}`);
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

  test('Основні маршрути повинні працювати', async () => {
    if (!serverPort) {
      throw new Error('Сервер не запустився');
    }

    const routes = [
      '/Stay_on_the_board',
      '/Stay_on_the_board/about',
      '/Stay_on_the_board/game',
      '/Stay_on_the_board/controls',
      '/Stay_on_the_board/settings',
      '/Stay_on_the_board/rules'
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

  test('Сайт повинен завантажуватися швидко', async () => {
    if (!serverPort) {
      throw new Error('Сервер не запустився');
    }

    const startTime = Date.now();
    try {
      const response = await fetch(`http://localhost:${serverPort}/Stay_on_the_board`);
      const html = await response.text();
      const loadTime = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(loadTime).toBeLessThan(5000); // Менше 5 секунд
      console.log(`✅ Сайт завантажився за ${loadTime}ms`);
    } catch (error) {
      console.error('❌ Помилка тесту швидкості:', error);
      throw error;
    }
  });
});

describe('Build Health Check', () => {
  test('Проект повинен збиратися без помилок', async () => {
    console.log('🔨 Перевірка збірки проекту...');
    
    return new Promise((resolve, reject) => {
      const buildProcess = spawn('npm', ['run', 'build'], {
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe']
      });

      const timeout = setTimeout(() => {
        buildProcess.kill();
        reject(new Error('Таймаут збірки'));
      }, 30000);

      buildProcess.stdout.on('data', (data) => {
        console.log('📝 Вивід збірки:', data.toString());
      });

      buildProcess.stderr.on('data', (data) => {
        console.log('⚠️ Помилки збірки:', data.toString());
      });

      buildProcess.on('close', (code) => {
        clearTimeout(timeout);
        if (code === 0) {
          console.log('✅ Збірка успішна');
          resolve();
        } else {
          reject(new Error(`Збірка невдала з кодом ${code}`));
        }
      });

      buildProcess.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  });
}); 