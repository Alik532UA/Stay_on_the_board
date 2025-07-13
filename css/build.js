#!/usr/bin/env node

/**
 * CSS Builder для Stay on the Board
 * Автоматично об'єднує всі CSS модулі в один файл
 */

const fs = require('fs');
const path = require('path');

// Конфігурація
const CONFIG = {
    inputDir: __dirname,
    outputFile: path.join(__dirname, 'bundle.css'),
    mainFile: 'main.css',
    excludeFiles: ['bundle.css', 'build.js', 'README.md']
};

// Функція для читання файлу
function readFile(filePath) {
    try {
        return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
        console.error(`Помилка читання файлу ${filePath}:`, error.message);
        return '';
    }
}

// Функція для обробки @import
function processImports(content, baseDir) {
    const importRegex = /@import\s+url\(['"]([^'"]+)['"]\);/g;
    let processedContent = content;
    let match;

    while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1];
        const fullPath = path.join(baseDir, importPath);
        
        if (fs.existsSync(fullPath)) {
            const importedContent = readFile(fullPath);
            const processedImported = processImports(importedContent, path.dirname(fullPath));
            
            processedContent = processedContent.replace(match[0], processedImported);
        } else {
            console.warn(`Файл не знайдено: ${fullPath}`);
        }
    }

    return processedContent;
}

// Функція для збірки CSS
function buildCSS() {
    console.log('🚀 Початок збірки CSS...');
    
    const mainFilePath = path.join(CONFIG.inputDir, CONFIG.mainFile);
    
    if (!fs.existsSync(mainFilePath)) {
        console.error(`❌ Головний файл не знайдено: ${CONFIG.mainFile}`);
        return false;
    }

    // Читаємо головний файл
    let content = readFile(mainFilePath);
    
    // Обробляємо імпорти
    content = processImports(content, CONFIG.inputDir);
    
    // Додаємо коментар з інформацією про збірку
    const buildInfo = `/*
 * Stay on the Board - CSS Bundle
 * Автоматично згенеровано: ${new Date().toISOString()}
 * З файлів: ${CONFIG.mainFile}
 * 
 * Цей файл створено автоматично. Для змін редагуйте окремі модулі.
 */

`;
    
    const finalContent = buildInfo + content;
    
    // Записуємо результат
    try {
        fs.writeFileSync(CONFIG.outputFile, finalContent, 'utf8');
        console.log(`✅ CSS збірку створено: ${CONFIG.outputFile}`);
        console.log(`📊 Розмір файлу: ${(finalContent.length / 1024).toFixed(2)} KB`);
        return true;
    } catch (error) {
        console.error('❌ Помилка запису файлу:', error.message);
        return false;
    }
}

// Функція для мініфікації CSS
function minifyCSS() {
    const bundlePath = CONFIG.outputFile;
    
    if (!fs.existsSync(bundlePath)) {
        console.error('❌ Файл збірки не знайдено. Спочатку виконайте збірку.');
        return false;
    }
    
    let content = readFile(bundlePath);
    
    // Проста мініфікація (видалення коментарів та зайвих пробілів)
    content = content
        .replace(/\/\*[\s\S]*?\*\//g, '') // Видаляємо коментарі
        .replace(/\s+/g, ' ') // Заміняємо множинні пробіли на один
        .replace(/\s*{\s*/g, '{') // Видаляємо пробіли навколо фігурних дужок
        .replace(/\s*}\s*/g, '}') // Видаляємо пробіли навколо фігурних дужок
        .replace(/\s*:\s*/g, ':') // Видаляємо пробіли навколо двокрапки
        .replace(/\s*;\s*/g, ';') // Видаляємо пробіли навколо крапки з комою
        .replace(/\s*,\s*/g, ',') // Видаляємо пробіли навколо коми
        .trim();
    
    const minifiedPath = path.join(CONFIG.inputDir, 'bundle.min.css');
    
    try {
        fs.writeFileSync(minifiedPath, content, 'utf8');
        console.log(`✅ Мініфікований CSS створено: ${minifiedPath}`);
        console.log(`📊 Розмір файлу: ${(content.length / 1024).toFixed(2)} KB`);
        return true;
    } catch (error) {
        console.error('❌ Помилка створення мініфікованого файлу:', error.message);
        return false;
    }
}

// Функція для перевірки структури
function validateStructure() {
    console.log('🔍 Перевірка структури CSS...');
    
    const requiredDirs = ['base', 'themes', 'components', 'layouts'];
    const requiredFiles = [
        'base/variables.css',
        'themes/peak.css',
        'themes/cs2.css',
        'components/game-board.css',
        'components/controls.css',
        'components/modals.css',
        'layouts/main-menu.css',
        'main.css'
    ];
    
    let isValid = true;
    
    // Перевіряємо директорії
    for (const dir of requiredDirs) {
        const dirPath = path.join(CONFIG.inputDir, dir);
        if (!fs.existsSync(dirPath)) {
            console.error(`❌ Відсутня директорія: ${dir}`);
            isValid = false;
        } else {
            console.log(`✅ Директорія знайдена: ${dir}`);
        }
    }
    
    // Перевіряємо файли
    for (const file of requiredFiles) {
        const filePath = path.join(CONFIG.inputDir, file);
        if (!fs.existsSync(filePath)) {
            console.error(`❌ Відсутній файл: ${file}`);
            isValid = false;
        } else {
            const stats = fs.statSync(filePath);
            console.log(`✅ Файл знайдено: ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
        }
    }
    
    return isValid;
}

// Головна функція
function main() {
    const args = process.argv.slice(2);
    const command = args[0] || 'build';
    
    switch (command) {
        case 'build':
            if (validateStructure()) {
                buildCSS();
            } else {
                console.error('❌ Структура CSS недійсна');
                process.exit(1);
            }
            break;
            
        case 'minify':
            minifyCSS();
            break;
            
        case 'validate':
            validateStructure();
            break;
            
        case 'watch':
            console.log('👀 Режим спостереження запущено...');
            console.log('Натисніть Ctrl+C для зупинки');
            
            // Спостерігаємо за змінами в CSS файлах
            const chokidar = require('chokidar');
            const watcher = chokidar.watch(path.join(CONFIG.inputDir, '**/*.css'), {
                ignored: /bundle\.(css|min\.css)$/
            });
            
            watcher.on('change', (filePath) => {
                console.log(`📝 Файл змінено: ${path.relative(CONFIG.inputDir, filePath)}`);
                buildCSS();
            });
            
            break;
            
        default:
            console.log(`
🎮 CSS Builder для Stay on the Board

Використання:
  node build.js [команда]

Команди:
  build     - Зібрати CSS (за замовчуванням)
  minify    - Мініфікувати зібраний CSS
  validate  - Перевірити структуру файлів
  watch     - Спостерігати за змінами та автоматично збирати

Приклади:
  node build.js build
  node build.js minify
  node build.js validate
  node build.js watch
            `);
    }
}

// Запускаємо якщо файл викликано напряму
if (require.main === module) {
    main();
}

module.exports = {
    buildCSS,
    minifyCSS,
    validateStructure
}; 