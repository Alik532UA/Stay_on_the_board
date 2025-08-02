import { describe, test, expect, vi } from 'vitest';

// Мокаємо requestAnimationFrame для тестового середовища
global.requestAnimationFrame = vi.fn((cb: FrameRequestCallback) => {
  const id = setTimeout(cb, 0);
  return id as number;
});

describe('Runtime Errors Diagnostics', () => {
  test('перевірка наявності основних браузерних API', () => {
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