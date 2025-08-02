#!/usr/bin/env node

/**
 * Скрипт для швидкої діагностики сайту
 * Використання: node scripts/diagnose.js
 */

import { execSync, spawn } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

console.log('🔍 Діагностика сайту Stay on the Board...\n');

// Функція для перевірки файлу
function checkFile(path, description) {
  try {
    if (existsSync(path)) {
      const content = readFileSync(path, 'utf8');
      console.log(`✅ ${description}: ${path} (${content.length} символів)`);
      return true;
    } else {
      console.log(`❌ ${description}: ${path} - ФАЙЛ ВІДСУТНІЙ`);
      return false;
    }
  } catch (error) {
    console.log(`⚠️ ${description}: ${path} - ПОМИЛКА: ${error.message}`);
    return false;
  }
}

// Функція для перевірки директорії
function checkDirectory(path, description) {
  try {
    if (existsSync(path)) {
      console.log(`✅ ${description}: ${path}`);
      return true;
    } else {
      console.log(`❌ ${description}: ${path} - ДИРЕКТОРІЯ ВІДСУТНЯ`);
      return false;
    }
  } catch (error) {
    console.log(`⚠️ ${description}: ${path} - ПОМИЛКА: ${error.message}`);
    return false;
  }
}

// Функція для перевірки команди
function checkCommand(command, description) {
  try {
    execSync(command, { stdio: 'pipe' });
    console.log(`✅ ${description}: ${command}`);
    return true;
  } catch (error) {
    console.log(`❌ ${description}: ${command} - ПОМИЛКА: ${error.message}`);
    return false;
  }
}

// Основна діагностика
console.log('📁 Перевірка структури проекту:');
const criticalFiles = [
  ['package.json', 'Package.json'],
  ['vite.config.ts', 'Vite конфігурація'],
  ['svelte.config.js', 'Svelte конфігурація'],
  ['tsconfig.json', 'TypeScript конфігурація'],
  ['src/app.html', 'Основний HTML файл'],
  ['src/routes/+page.svelte', 'Головна сторінка'],
  ['src/lib/stores/gameState.ts', 'Game State'],
  ['src/lib/stores/animationStore.js', 'Animation Store'],
  ['src/lib/services/gameLogicService.ts', 'Game Logic Service'],
  ['src/lib/gameOrchestrator.js', 'Game Orchestrator']
];

let fileErrors = 0;
for (const [path, description] of criticalFiles) {
  if (!checkFile(path, description)) {
    fileErrors++;
  }
}

console.log('\n📂 Перевірка директорій:');
const criticalDirs = [
  ['src', 'Source директорія'],
  ['src/routes', 'Routes директорія'],
  ['src/lib', 'Lib директорія'],
  ['src/lib/stores', 'Stores директорія'],
  ['src/lib/services', 'Services директорія'],
  ['src/lib/components', 'Components директорія'],
  ['static', 'Static директорія']
];

let dirErrors = 0;
for (const [path, description] of criticalDirs) {
  if (!checkDirectory(path, description)) {
    dirErrors++;
  }
}

console.log('\n📦 Перевірка залежностей:');
try {
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  const criticalDeps = ['svelte', '@sveltejs/kit', 'vite'];
  for (const dep of criticalDeps) {
    if (deps[dep]) {
      console.log(`✅ Критична залежність: ${dep}@${deps[dep]}`);
    } else {
      console.log(`❌ Відсутня критична залежність: ${dep}`);
      fileErrors++;
    }
  }
} catch (error) {
  console.log(`❌ Помилка читання package.json: ${error.message}`);
  fileErrors++;
}

console.log('\n🔧 Перевірка команд:');
const commands = [
  ['npm --version', 'NPM'],
  ['node --version', 'Node.js'],
  ['npx --version', 'NPX']
];

let commandErrors = 0;
for (const [command, description] of commands) {
  if (!checkCommand(command, description)) {
    commandErrors++;
  }
}

console.log('\n🚀 Перевірка запуску dev сервера:');
console.log('Спроба запуску dev сервера...');

try {
  const devProcess = spawn('npm', ['run', 'dev'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    timeout: 10000
  });

  let serverStarted = false;
  let output = '';

  devProcess.stdout.on('data', (data) => {
    output += data.toString();
    if (output.includes('Local:') && !serverStarted) {
      const portMatch = output.match(/Local:\s+http:\/\/localhost:(\d+)/);
      if (portMatch) {
        console.log(`✅ Dev сервер запустився на порту ${portMatch[1]}`);
        serverStarted = true;
        devProcess.kill();
      }
    }
  });

  devProcess.stderr.on('data', (data) => {
    output += data.toString();
  });

  devProcess.on('close', (code) => {
    if (!serverStarted) {
      console.log(`❌ Dev сервер не запустився (код: ${code})`);
      console.log('Вивід:', output);
      commandErrors++;
    }
  });

  devProcess.on('error', (error) => {
    console.log(`❌ Помилка запуску dev сервера: ${error.message}`);
    commandErrors++;
  });

} catch (error) {
  console.log(`❌ Помилка запуску dev сервера: ${error.message}`);
  commandErrors++;
}

// Підсумок
console.log('\n📊 ПІДСУМОК ДІАГНОСТИКИ:');
console.log(`Файли: ${criticalFiles.length - fileErrors}/${criticalFiles.length} ✅`);
console.log(`Директорії: ${criticalDirs.length - dirErrors}/${criticalDirs.length} ✅`);
console.log(`Команди: ${commands.length - commandErrors}/${commands.length} ✅`);

const totalErrors = fileErrors + dirErrors + commandErrors;

if (totalErrors === 0) {
  console.log('\n🎉 ВСЕ ДОБРЕ! Сайт готовий до роботи.');
  process.exit(0);
} else {
  console.log(`\n⚠️ Знайдено ${totalErrors} проблем. Потрібно виправити перед запуском.`);
  process.exit(1);
} 