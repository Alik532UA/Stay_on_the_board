import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Налаштування __dirname для ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Шляхи до файлів
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const staticVersionPath = path.join(__dirname, '..', 'static', 'version.json');

try {
    // 1. Піднімаємо версію в package.json та package-lock.json
    console.log('🔄 Updating version (npm version patch)...');
    // --no-git-tag-version: не створювати git тег
    execSync('npm version patch --no-git-tag-version', { stdio: 'inherit' });

    // 2. Зчитуємо нову версію з package.json вручну (require не працює для JSON в ESM так просто)
    const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(packageJsonContent);
    const newVersion = packageJson.version;

    console.log(`✅ New version: ${newVersion}`);

    // 3. Оновлюємо static/version.json
    const staticVersionContent = { version: newVersion };
    fs.writeFileSync(staticVersionPath, JSON.stringify(staticVersionContent, null, 2));
    console.log(`✅ Updated static/version.json`);

    // 4. Додаємо змінені файли до Git (stage)
    execSync('git add package.json package-lock.json static/version.json', { stdio: 'inherit' });
    console.log('✅ Files staged for commit');

} catch (error) {
    console.error('❌ Error updating version:', error);
    process.exit(1);
}