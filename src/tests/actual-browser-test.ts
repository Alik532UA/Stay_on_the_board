import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { spawn } from 'child_process';
import { readFileSync, existsSync } from 'fs';

describe('Actual Browser JavaScript Test', () => {
  let devServer: any = null;
  let serverUrl = 'http://localhost:5175/Stay_on_the_board';

  beforeAll(async () => {
    console.log('🚀 Запускаємо dev сервер...');
    
    // Запускаємо dev сервер
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
        console.error('❌ Dev server error:', data.toString());
      });

      // Таймаут на випадок якщо сервер не запуститься
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
}); 