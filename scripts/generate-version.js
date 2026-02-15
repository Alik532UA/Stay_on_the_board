import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Читаємо package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

const versionData = {
    version: packageJson.version,
    buildTime: new Date().toISOString()
};

const outputPath = path.join(__dirname, '..', 'static', 'version.json');
fs.writeFileSync(outputPath, JSON.stringify(versionData, null, 2));

console.log(`✅ Generated static/version.json: ${versionData.version} (${versionData.buildTime})`);
